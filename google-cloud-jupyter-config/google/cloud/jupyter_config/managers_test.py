# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from google.cloud.jupyter_config.managers import (
    DataprocGatewayKernelSpecManager,
    DataprocGatewayMappingKernelManager,
)


@pytest.mark.asyncio
async def test_dataproc_gateway_kernel_spec_manager_no_notifications():
    manager = DataprocGatewayKernelSpecManager()
    
    # Mock super().list_kernel_specs
    mock_super_specs = {
        "default": "python3",
        "kernelspecs": {
            "python3": {
                "name": "python3",
                "resources": {}
            }
        }
    }
    
    received_notifications = None
    def sink(notifications):
        nonlocal received_notifications
        received_notifications = notifications
        
    manager.notifications_sink = sink
    
    with patch("jupyter_server.gateway.managers.GatewayKernelSpecManager.list_kernel_specs", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = mock_super_specs
        result = await manager.list_kernel_specs()
        
        assert result == mock_super_specs
        assert received_notifications is None


@pytest.mark.asyncio
async def test_dataproc_gateway_kernel_spec_manager_with_notifications():
    manager = DataprocGatewayKernelSpecManager()
    
    mock_warnings = [{"id": "hash-123", "message": "Deprecated region warning"}]
    mock_super_specs = {
        "default": "python3",
        "kernelspecs": {},
        "warnings": mock_warnings
    }
    
    received_notifications = None
    def sink(notifications):
        nonlocal received_notifications
        received_notifications = notifications
        
    manager.notifications_sink = sink
    
    with patch("jupyter_server.gateway.managers.GatewayKernelSpecManager.list_kernel_specs", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = mock_super_specs
        result = await manager.list_kernel_specs()
        
        assert result == mock_super_specs
        assert received_notifications is not None
        assert len(received_notifications) == 1
        assert received_notifications[0]["id"] == "hash-123"
        assert received_notifications[0]["message"] == "Deprecated region warning"
        assert received_notifications[0]["sticky"] is False
        assert "created" in received_notifications[0]


@pytest.mark.asyncio
async def test_dataproc_gateway_mapping_kernel_manager_no_dead_kernels():
    manager = DataprocGatewayMappingKernelManager()
    
    mock_kernels = [{"id": "kernel-1", "status": "starting"}]
    
    received_notifications = None
    def sink(notifications):
        nonlocal received_notifications
        received_notifications = notifications
        
    manager.notifications_sink = sink
    
    with patch("jupyter_server.gateway.managers.GatewayMappingKernelManager.list_kernels", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = mock_kernels
        result = await manager.list_kernels()
        
        assert result == mock_kernels
        assert received_notifications is None


@pytest.mark.asyncio
async def test_dataproc_gateway_mapping_kernel_manager_with_dead_kernel():
    manager = DataprocGatewayMappingKernelManager()
    
    mock_kernels = [
        {"id": "kernel-1", "status": "running"},
        {"id": "kernel-2", "status": "dead", "message": "Out of memory"},
    ]
    
    received_notifications = None
    def sink(notifications):
        nonlocal received_notifications
        received_notifications = notifications
        
    manager.notifications_sink = sink
    
    with patch("jupyter_server.gateway.managers.GatewayMappingKernelManager.list_kernels", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = mock_kernels
        result = await manager.list_kernels()
        
        assert result == mock_kernels
        assert received_notifications is not None
        assert len(received_notifications) == 1
        assert received_notifications[0]["id"] == "kernel-2"
        assert "is not responsive" in received_notifications[0]["message"]
        assert "Out of memory" in received_notifications[0]["message"]
        assert received_notifications[0]["sticky"] is False


@pytest.mark.asyncio
async def test_dataproc_gateway_managers_use_singleton_sink():
    from google.cloud.jupyter_config.notifications import DataprocNotificationHandler
    DataprocNotificationHandler.clear_instance()

    received_notifications = None
    mock_logger = MagicMock()
    handler = DataprocNotificationHandler.instance(event_logger=mock_logger)

    manager = DataprocGatewayKernelSpecManager()
    assert manager.notifications_sink is None
    assert manager._get_notifications_sink() is handler

    mapping_manager = DataprocGatewayMappingKernelManager()
    assert mapping_manager.notifications_sink is None
    assert mapping_manager._get_notifications_sink() is handler

    DataprocNotificationHandler.clear_instance()
