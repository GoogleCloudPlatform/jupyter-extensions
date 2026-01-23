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

import json
import pytest
import uuid

from jupyter_server.utils import url_path_join


@pytest.fixture
def http_server_client(http_server_client):
    http_server_client.max_clients = 500
    return http_server_client


async def test_list_top_level(jp_fetch):
    response = await jp_fetch(
        "api",
        "contents",
        method="GET",
    )
    data = json.loads(response.body.decode())
    assert data["type"] == "directory"
    assert len(data["content"]) == 2

    child_names = [nested["name"] for nested in data["content"]]
    assert "GCS" in child_names
    assert "Local Disk" in child_names


@pytest.mark.parametrize("top_level_path", ["GCS", "Local Disk"])
async def test_file_handlers(jp_fetch, top_level_path):
    response = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        method="GET",
    )
    data = json.loads(response.body.decode())
    assert data["type"] == "directory"
    assert len(data["content"]) == 0

    # An empty post tells Jupyter to create a new, "untitled" file.
    response2 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        method="POST",
        body="",
    )
    created = json.loads(response2.body.decode())
    assert created["type"] == "file"
    assert created["name"] == "untitled"

    response3 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        method="GET",
    )
    data2 = json.loads(response3.body.decode())
    assert data2["type"] == "directory"
    assert len(data2["content"]) == 1

    # Create an untitled text file.
    response4 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        method="POST",
        body=json.dumps({"type": "file", "ext": ".txt"}),
    )
    created2 = json.loads(response4.body.decode())
    assert created2["type"] == "file"
    assert created2["name"] == "untitled.txt"

    # Create an untitled directory.
    response5 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        method="POST",
        body=json.dumps({"type": "directory"}),
    )
    created_dir = json.loads(response5.body.decode())
    assert created_dir["type"] == "directory"
    assert created_dir["name"] == "Untitled Folder"

    response6 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        method="GET",
    )
    listed_dir = json.loads(response.body.decode())
    assert listed_dir["type"] == "directory"
    assert len(listed_dir["content"]) == 0

    # Create a titled directory.
    response7 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        method="PUT",
        body=json.dumps({"type": "directory"}),
    )
    titled_dir = json.loads(response7.body.decode())
    assert titled_dir["type"] == "directory"
    assert titled_dir["name"] == "test_dir"

    # Create an utitled notebook.
    response8 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        method="POST",
        body=json.dumps({"type": "notebook"}),
    )
    nb = json.loads(response8.body.decode())
    assert nb["type"] == "notebook"
    assert nb["name"] == "Untitled.ipynb"

    # Create a second utitled notebook.
    response9 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        method="POST",
        body=json.dumps({"type": "notebook"}),
    )
    nb2 = json.loads(response9.body.decode())
    assert nb2["type"] == "notebook"
    assert nb2["name"] == "Untitled1.ipynb"

    nb_contents = {
        "cells": [
            {
                "cell_type": "code",
                "id": uuid.uuid4().hex,
                "execution_count": 0,
                "metadata": {},
                "outputs": [],
                "source": "1 + 1",
            },
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python",
                "name": "python3",
            },
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }

    # Update notebook.
    response10 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        "Untitled1.ipynb",
        method="PUT",
        body=json.dumps({"type": "notebook", "content": nb_contents}),
    )
    nb3 = json.loads(response10.body.decode())
    assert nb3["type"] == "notebook", json.dumps(nb3)
    assert nb3["name"] == "Untitled1.ipynb", json.dumps(nb3)

    # Get the updated notebook.
    response11 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        "Untitled1.ipynb",
        method="GET",
    )
    nb4 = json.loads(response11.body.decode())
    assert nb4["type"] == "notebook", json.dumps(nb4)
    assert nb4["name"] == "Untitled1.ipynb", json.dumps(nb4)
    assert nb4["content"] is not None, json.dumps(nb4)
    assert len(nb4["content"]["cells"]) == 1, json.dumps(nb4)
    assert nb4["content"]["cells"][0]["source"] == "1 + 1", json.dumps(nb4)

    # Rename the notebook
    new_path = nb4["path"].replace("Untitled1", "TestNotebook")
    response12 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        "Untitled1.ipynb",
        method="PATCH",
        body=json.dumps({"type": "notebook", "path": new_path}),
    )
    nb5 = json.loads(response12.body.decode())
    assert nb5["type"] == "notebook", json.dumps(nb5)
    assert nb5["name"] == "TestNotebook.ipynb", json.dumps(nb5)

    # Confirm the notebook was renamed
    response13 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        "TestNotebook.ipynb",
        method="GET",
    )
    nb6 = json.loads(response13.body.decode())
    assert nb6["type"] == "notebook", json.dumps(nb6)
    assert nb6["name"] == "TestNotebook.ipynb", json.dumps(nb6)
    assert nb6["content"] is not None, json.dumps(nb6)
    assert len(nb6["content"]["cells"]) == 1, json.dumps(nb6)
    assert nb6["content"]["cells"][0]["source"] == "1 + 1", json.dumps(nb6)

    # Deleta a file
    response14 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        "Untitled.ipynb",
        method="DELETE",
    )
    assert response14.code == 204

    # Confirm the file was deleted
    response15 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        "test_dir",
        method="GET",
    )
    post_delete_dir = json.loads(response15.body.decode())
    assert post_delete_dir["type"] == "directory"
    assert post_delete_dir["name"] == "test_dir"
    post_delete_contents = [
        child["name"]
        for child in post_delete_dir["content"]
        if child["name"] != ".ipynb_checkpoints"
    ]
    assert len(post_delete_contents) == 1, post_delete_contents
    assert post_delete_contents[0] == "TestNotebook.ipynb"

    # Create a bunch of notebooks in parallel and make sure they don't
    # create a backlog of requests
    notebook_count = 230
    create_callbacks = []
    for i in range(1, notebook_count):
        create_callbacks.append(
            jp_fetch(
                "api",
                "contents",
                top_level_path,
                created_dir["name"],
                "test_dir",
                f"Test Notebook {i}.ipynb",
                method="PUT",
                body=json.dumps({"type": "notebook", "content": nb_contents}),
            )
        )
    for callback in create_callbacks:
        await callback

    delete_callbacks = []
    for i in range(1, notebook_count):
        delete_callbacks.append(
            jp_fetch(
                "api",
                "contents",
                top_level_path,
                created_dir["name"],
                "test_dir",
                f"Test Notebook {i}.ipynb",
                method="DELETE",
            )
        )
    for callback in delete_callbacks:
        await callback

    # Delete a directory with nested contents
    response16 = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        created_dir["name"],
        method="DELETE",
    )
    assert response16.code == 204

    # Get the final contents of the directory
    final_response = await jp_fetch(
        "api",
        "contents",
        top_level_path,
        method="GET",
    )
    final_contents = json.loads(final_response.body.decode())
    assert final_contents["type"] == "directory"

    remaining_files = [
        child["name"]
        for child in final_contents["content"]
        if child["name"] != ".ipynb_checkpoints"
    ]
    assert len(remaining_files) == 2, json.dumps(final_contents)
    assert "untitled" in remaining_files
    assert "untitled.txt" in remaining_files
    assert "Untitled Folder" not in remaining_files
