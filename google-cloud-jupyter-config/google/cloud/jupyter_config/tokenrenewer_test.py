# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import subprocess
import sys
import time

import pytest

from google.cloud.jupyter_config.tokenrenewer import CommandTokenRenewer


# A token command that emits a distinct token every time it is run, and that
# records the number of times it has been started in a counter file.
#
# The counter is incremented before the (configurable) delay so that tests can
# observe that the command has been *started* without waiting for it to finish.
_TOKEN_SCRIPT = """
import pathlib
import sys
import time

counter = pathlib.Path(sys.argv[1])
runs = int(counter.read_text()) if counter.exists() else 0
counter.write_text(str(runs + 1))
time.sleep(float(sys.argv[2]))
print("token-{}".format(runs))
"""


_FAILING_SCRIPT = """
import sys

sys.stderr.write("unable to generate a token\\n")
sys.exit(3)
"""


class _TokenCommand:
    """A cross-platform token command for use in tests."""

    def __init__(self, tmp_path):
        self._script = tmp_path / "token_command.py"
        self._script.write_text(_TOKEN_SCRIPT)
        self._counter = tmp_path / "counter"

    def with_delay(self, delay):
        """Return a command line that takes `delay` seconds to produce a token."""
        return f'"{sys.executable}" "{self._script}" "{self._counter}" {delay}'

    def runs(self):
        """Return the number of times the command has been started."""
        if not self._counter.exists():
            return 0
        return int(self._counter.read_text())

    def wait_for_runs(self, expected, timeout=30):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self.runs() >= expected:
                return
            time.sleep(0.05)
        raise AssertionError(
            f"expected the command to have run {expected} times, "
            f"but it only ran {self.runs()} times"
        )


@pytest.fixture
def token_command(tmp_path):
    return _TokenCommand(tmp_path)


@pytest.fixture
def make_renewer():
    """Build token renewers, cleaning up any still-running commands afterwards."""
    renewers = []

    def _make(**kwargs):
        renewer = CommandTokenRenewer(**kwargs)
        renewers.append(renewer)
        return renewer

    yield _make

    for renewer in renewers:
        pending = renewer._pending_process
        if pending is not None:
            pending.kill()
            pending.communicate()


def test_get_token_returns_the_command_output(make_renewer, token_command):
    renewer = make_renewer(token_command=token_command.with_delay(0))

    assert renewer.get_token("Authorization", "Bearer", "") == "token-0"


def test_placeholder_auth_token_is_replaced(make_renewer, token_command):
    """The initial `auth_token` is a placeholder that must not be passed through.

    `configure_gateway_client` seeds `GatewayClient.auth_token` with an invalid
    non-empty string because jupyter_server will not invoke the token renewer
    at all when it is empty. See
    https://github.com/jupyter-server/jupyter_server/issues/1339.
    """
    renewer = make_renewer(token_command=token_command.with_delay(0))

    token = renewer.get_token("Authorization", "Bearer", "Initial, invalid value")

    assert token == "token-0"


def test_token_is_cached_for_its_lifetime(make_renewer, token_command):
    renewer = make_renewer(
        token_command=token_command.with_delay(0), token_lifetime_seconds=300
    )

    assert renewer.get_token("Authorization", "Bearer", "") == "token-0"
    assert renewer.get_token("Authorization", "Bearer", "token-0") == "token-0"


def test_command_is_started_before_the_first_token_is_requested(
    make_renewer, token_command
):
    make_renewer(token_command=token_command.with_delay(0.5))

    token_command.wait_for_runs(1)


def test_next_command_is_started_before_the_token_expires(
    make_renewer, token_command
):
    renewer = make_renewer(token_command=token_command.with_delay(0.5))

    assert renewer.get_token("Authorization", "Bearer", "") == "token-0"

    # Generating the next token is already under way, well before the current
    # token's lifetime has elapsed.
    token_command.wait_for_runs(2)


def test_renewal_does_not_wait_for_the_command(make_renewer, token_command):
    delay = 1.0
    renewer = make_renewer(
        token_command=token_command.with_delay(delay), token_lifetime_seconds=0
    )

    assert renewer.get_token("Authorization", "Bearer", "") == "token-0"

    # Stand in for the token's lifetime elapsing, during which the command for
    # the next token runs to completion in the background.
    token_command.wait_for_runs(2)
    time.sleep(delay + 0.5)

    started = time.monotonic()
    assert renewer.get_token("Authorization", "Bearer", "token-0") == "token-1"
    assert time.monotonic() - started < delay / 2


def test_failing_command_raises(make_renewer, tmp_path):
    script = tmp_path / "failing_command.py"
    script.write_text(_FAILING_SCRIPT)
    renewer = make_renewer(token_command=f'"{sys.executable}" "{script}"')

    with pytest.raises(subprocess.CalledProcessError):
        renewer.get_token("Authorization", "Bearer", "")
