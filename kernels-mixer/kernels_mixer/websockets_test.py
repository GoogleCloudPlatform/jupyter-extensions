# Copyright 2024 Google LLC
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

import datetime
import json
import uuid

import pytest


@pytest.fixture
async def test_kernel(jp_fetch):
    kr = await jp_fetch("api", "kernels", method="POST", body=json.dumps({"name": "python3"}))
    k = json.loads(kr.body.decode("utf-8"))
    return k


async def close_and_drain_pending_messages(ws):
    ws.close()
    for attempt in range(10):
        resp = await ws.read_message()
        if resp == None:
            return
    raise AssertionError("failed to drain the pending messages after 10 attempts")


async def test_websocket(jp_fetch, jp_ws_fetch, test_kernel):
    k = await test_kernel
    assert "id" in k

    ksr = await jp_fetch("api", "kernelspecs", k.get("name"))
    ks = json.loads(ksr.body.decode("utf-8"))
    assert " (Local)" in ks.get("spec", {}).get("display_name", None)

    session_id = uuid.uuid1().hex
    message_id = uuid.uuid1().hex
    ws = await jp_ws_fetch("api", "kernels", k["id"], "channels")
    await ws.write_message(json.dumps({
        "channel": "shell",
        "header": {
            "date": datetime.datetime.now().isoformat(),
            "session": session_id,
            "msg_id": message_id,
            "msg_type": "execute_request",
            "username": "",
            "version": "5.2",
        },
        "parent_header": {},
        "metadata": {},
        "content": {
            "code": "1 + 2",
            "silent": False,
            "allow_stdin": False,
            "stop_on_error": True,
        },
        "buffers": [],
    }))

    # We expect multiple response messages, including at least (but possiblye more):
    #
    #   An initial  "busy" status message in response to a kernel info request.
    #   A subsequent "idle" status messages in response to a kernel info request.
    #   A busy status message in response to the execute request.
    #   An execute input message.
    #   An execute result message.
    #   An execute reply message.
    #   An idle status message in response to the execute request.
    for attempt in range(10):
        resp = await ws.read_message()
        resp_json = json.loads(resp)
        response_type = resp_json.get("header", {}).get("msg_type", None)
        parent_message = resp_json.get("parent_header", {}).get("msg_id", None)
        if response_type == "execute_result" and parent_message == message_id:
            result = resp_json.get("content", {}).get("data", {}).get("text/plain", None)
            assert result == "3"

            await close_and_drain_pending_messages(ws)
            return

    await close_and_drain_pending_messages(ws)
    raise AssertionError("Never got a response to the code execution")
