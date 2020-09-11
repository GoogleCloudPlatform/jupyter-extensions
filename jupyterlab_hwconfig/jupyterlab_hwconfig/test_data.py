# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

METADATA_RESPONSE_BODY = """
{
  "instance":{
    "attributes":{
      "framework":"PyTorch:1.4",
      "install-nvidia-driver":"True",
      "notebooks-api":"PROD",
      "proxy-mode":"service_account",
      "proxy-url":"44dcc67790e9c556-dot-us-west1.notebooks.googleusercontent.com",
      "shutdown-script":"timeout 30 gcloud compute instances remove-metadata pytorch --keys=proxy-url --zone us-west1-b",
      "title":"PyTorch/fastai/CUDA10.0",
      "version":"44"
    },
    "cpuPlatform":"Intel Broadwell",
    "description":"",
    "disks":[
      {
        "deviceName":"persistent-disk-0",
        "index":0,
        "mode":"READ_WRITE",
        "type":"PERSISTENT"
      }
    ],
    "guestAttributes":{

    },
    "hostname":"pytorch.c.test-project.internal",
    "id":127546640929027970,
    "image":"projects/deeplearning-platform-release/global/images/pytorch-1-4-cu101-notebooks-20200302",
    "legacyEndpointAccess":{
      "0.1":0,
      "v1beta1":0
    },
    "licenses":[
      {
        "id":"1000205"
      },
      {
        "id":"5638175847114525401"
      },
      {
        "id":"6695225044516563714"
      }
    ],
    "machineType":"projects/123456/machineTypes/n1-standard-1",
    "maintenanceEvent":"NONE",
    "name":"pytorch",
    "networkInterfaces":[
      {
        "accessConfigs":[
          {
            "externalIp":"34.83.159.72",
            "type":"ONE_TO_ONE_NAT"
          }
        ],
        "dnsServers":[
          "169.254.169.254"
        ],
        "forwardedIps":[

        ],
        "gateway":"10.138.0.1",
        "ip":"10.138.0.16",
        "ipAliases":[

        ],
        "mac":"42:01:0a:8a:00:10",
        "mtu":1460,
        "network":"projects/123456/networks/default",
        "subnetmask":"255.255.240.0",
        "targetInstanceIps":[

        ]
      }
    ],
    "preempted":"FALSE",
    "remainingCpuTime":-1,
    "scheduling":{
      "automaticRestart":"TRUE",
      "onHostMaintenance":"TERMINATE",
      "preemptible":"FALSE"
    },
    "serviceAccounts":{
      "123456-compute@developer.gserviceaccount.com":{
        "aliases":[
          "default"
        ],
        "email":"123456-compute@developer.gserviceaccount.com",
        "scopes":[
          "https://www.googleapis.com/auth/cloud-platform",
          "https://www.googleapis.com/auth/userinfo.email"
        ]
      },
      "default":{
        "aliases":[
          "default"
        ],
        "email":"123456-compute@developer.gserviceaccount.com",
        "scopes":[
          "https://www.googleapis.com/auth/cloud-platform",
          "https://www.googleapis.com/auth/userinfo.email"
        ]
      }
    },
    "tags":[
      "deeplearning-vm",
      "notebook-instance"
    ],
    "virtualClock":{
      "driftToken":"0"
    },
    "zone":"projects/123456/zones/us-west1-b"
  },
  "oslogin":{
    "authenticate":{
      "sessions":{

      }
    }
  },
  "project":{
    "attributes": { },
    "numericProjectId":123456,
    "projectId":"test-project"
  }
}
"""

MACHINE_TYPE_STDOUT = b"""creationTimestamp: '1969-12-31T16:00:00.000-08:00'
description: 1 vCPU, 3.75 GB RAM
guestCpus: 1
id: '3001'
imageSpaceGb: 10
isSharedCpu: false
kind: compute#machineType
maximumPersistentDisks: 128
maximumPersistentDisksSizeGb: '263168'
memoryMb: 3840
name: n1-standard-1
selfLink: https://www.googleapis.com/compute/v1/projects/projects/123456/zones/us-west1-b/machineTypes/n1-standard-1
zone: us-west1-b
"""

ZONE = 'projects/123456/zones/us-west1-b'
MACHINE_TYPE = 'projects/123456/machineTypes/n1-standard-1'

NVIDIA_SMI_STDOUT = b"""<?xml version="1.0" ?>
<!DOCTYPE nvidia_smi_log SYSTEM "nvsmi_device_v10.dtd">
<nvidia_smi_log>
	<timestamp>Mon Mar 23 20:20:02 2020</timestamp>
	<driver_version>418.87.01</driver_version>
	<cuda_version>10.1</cuda_version>
	<attached_gpus>1</attached_gpus>
	<gpu id="00000000:00:04.0">
		<product_name>Tesla K80</product_name>
		<product_brand>Tesla</product_brand>
		<display_mode>Disabled</display_mode>
		<display_active>Disabled</display_active>
		<persistence_mode>Disabled</persistence_mode>
		<accounting_mode>Disabled</accounting_mode>
		<accounting_mode_buffer_size>4000</accounting_mode_buffer_size>
		<driver_model>
			<current_dm>N/A</current_dm>
			<pending_dm>N/A</pending_dm>
		</driver_model>
		<serial>0324916015654</serial>
		<uuid>GPU-0d16eb32-3ea4-6014-4bbe-ca4606090a8b</uuid>
		<minor_number>0</minor_number>
		<vbios_version>80.21.25.00.01</vbios_version>
		<multigpu_board>No</multigpu_board>
		<board_id>0x4</board_id>
		<gpu_part_number>900-22080-6300-001</gpu_part_number>
		<inforom_version>
			<img_version>2080.0200.00.04</img_version>
			<oem_object>1.1</oem_object>
			<ecc_object>3.0</ecc_object>
			<pwr_object>N/A</pwr_object>
		</inforom_version>
		<gpu_operation_mode>
			<current_gom>N/A</current_gom>
			<pending_gom>N/A</pending_gom>
		</gpu_operation_mode>
		<gpu_virtualization_mode>
			<virtualization_mode>Pass-Through</virtualization_mode>
		</gpu_virtualization_mode>
		<ibmnpu>
			<relaxed_ordering_mode>N/A</relaxed_ordering_mode>
		</ibmnpu>
		<pci>
			<pci_bus>00</pci_bus>
			<pci_device>04</pci_device>
			<pci_domain>0000</pci_domain>
			<pci_device_id>102D10DE</pci_device_id>
			<pci_bus_id>00000000:00:04.0</pci_bus_id>
			<pci_sub_system_id>106C10DE</pci_sub_system_id>
			<pci_gpu_link_info>
				<pcie_gen>
					<max_link_gen>3</max_link_gen>
					<current_link_gen>3</current_link_gen>
				</pcie_gen>
				<link_widths>
					<max_link_width>16x</max_link_width>
					<current_link_width>16x</current_link_width>
				</link_widths>
			</pci_gpu_link_info>
			<pci_bridge_chip>
				<bridge_chip_type>N/A</bridge_chip_type>
				<bridge_chip_fw>N/A</bridge_chip_fw>
			</pci_bridge_chip>
			<replay_counter>0</replay_counter>
			<replay_rollover_counter>0</replay_rollover_counter>
			<tx_util>N/A</tx_util>
			<rx_util>N/A</rx_util>
		</pci>
		<fan_speed>N/A</fan_speed>
		<performance_state>P0</performance_state>
		<clocks_throttle_reasons>
			<clocks_throttle_reason_gpu_idle>Not Active</clocks_throttle_reason_gpu_idle>
			<clocks_throttle_reason_applications_clocks_setting>Not Active</clocks_throttle_reason_applications_clocks_setting>
			<clocks_throttle_reason_sw_power_cap>Not Active</clocks_throttle_reason_sw_power_cap>
			<clocks_throttle_reason_hw_slowdown>Not Active</clocks_throttle_reason_hw_slowdown>
			<clocks_throttle_reason_hw_thermal_slowdown>N/A</clocks_throttle_reason_hw_thermal_slowdown>
			<clocks_throttle_reason_hw_power_brake_slowdown>N/A</clocks_throttle_reason_hw_power_brake_slowdown>
			<clocks_throttle_reason_sync_boost>Not Active</clocks_throttle_reason_sync_boost>
			<clocks_throttle_reason_sw_thermal_slowdown>Not Active</clocks_throttle_reason_sw_thermal_slowdown>
			<clocks_throttle_reason_display_clocks_setting>Not Active</clocks_throttle_reason_display_clocks_setting>
		</clocks_throttle_reasons>
		<fb_memory_usage>
			<total>11441 MiB</total>
			<used>0 MiB</used>
			<free>11441 MiB</free>
		</fb_memory_usage>
		<bar1_memory_usage>
			<total>16384 MiB</total>
			<used>2 MiB</used>
			<free>16382 MiB</free>
		</bar1_memory_usage>
		<compute_mode>Default</compute_mode>
		<utilization>
			<gpu_util>100 %</gpu_util>
			<memory_util>6 %</memory_util>
			<encoder_util>0 %</encoder_util>
			<decoder_util>0 %</decoder_util>
		</utilization>
		<encoder_stats>
			<session_count>0</session_count>
			<average_fps>0</average_fps>
			<average_latency>0</average_latency>
		</encoder_stats>
		<fbc_stats>
			<session_count>0</session_count>
			<average_fps>0</average_fps>
			<average_latency>0</average_latency>
		</fbc_stats>
		<ecc_mode>
			<current_ecc>Enabled</current_ecc>
			<pending_ecc>Enabled</pending_ecc>
		</ecc_mode>
		<ecc_errors>
			<volatile>
				<single_bit>
					<device_memory>0</device_memory>
					<register_file>0</register_file>
					<l1_cache>0</l1_cache>
					<l2_cache>0</l2_cache>
					<texture_memory>0</texture_memory>
					<texture_shm>N/A</texture_shm>
					<cbu>N/A</cbu>
					<total>0</total>
				</single_bit>
				<double_bit>
					<device_memory>0</device_memory>
					<register_file>0</register_file>
					<l1_cache>0</l1_cache>
					<l2_cache>0</l2_cache>
					<texture_memory>0</texture_memory>
					<texture_shm>N/A</texture_shm>
					<cbu>N/A</cbu>
					<total>0</total>
				</double_bit>
			</volatile>
			<aggregate>
				<single_bit>
					<device_memory>2</device_memory>
					<register_file>0</register_file>
					<l1_cache>0</l1_cache>
					<l2_cache>0</l2_cache>
					<texture_memory>0</texture_memory>
					<texture_shm>N/A</texture_shm>
					<cbu>N/A</cbu>
					<total>2</total>
				</single_bit>
				<double_bit>
					<device_memory>0</device_memory>
					<register_file>0</register_file>
					<l1_cache>0</l1_cache>
					<l2_cache>0</l2_cache>
					<texture_memory>0</texture_memory>
					<texture_shm>N/A</texture_shm>
					<cbu>N/A</cbu>
					<total>0</total>
				</double_bit>
			</aggregate>
		</ecc_errors>
		<retired_pages>
			<multiple_single_bit_retirement>
				<retired_count>1</retired_count>
				<retired_pagelist>
					<retired_page>
						<retired_page_address>0x00000000002ce857</retired_page_address>
					</retired_page>
				</retired_pagelist>
			</multiple_single_bit_retirement>
			<double_bit_retirement>
				<retired_count>0</retired_count>
				<retired_pagelist>
				</retired_pagelist>
			</double_bit_retirement>
			<pending_blacklist>No</pending_blacklist>
			<pending_retirement>No</pending_retirement>
		</retired_pages>
		<temperature>
			<gpu_temp>42 C</gpu_temp>
			<gpu_temp_max_threshold>93 C</gpu_temp_max_threshold>
			<gpu_temp_slow_threshold>88 C</gpu_temp_slow_threshold>
			<gpu_temp_max_gpu_threshold>N/A</gpu_temp_max_gpu_threshold>
			<memory_temp>N/A</memory_temp>
			<gpu_temp_max_mem_threshold>N/A</gpu_temp_max_mem_threshold>
		</temperature>
		<power_readings>
			<power_state>P0</power_state>
			<power_management>Supported</power_management>
			<power_draw>70.20 W</power_draw>
			<power_limit>149.00 W</power_limit>
			<default_power_limit>149.00 W</default_power_limit>
			<enforced_power_limit>149.00 W</enforced_power_limit>
			<min_power_limit>100.00 W</min_power_limit>
			<max_power_limit>175.00 W</max_power_limit>
		</power_readings>
		<clocks>
			<graphics_clock>875 MHz</graphics_clock>
			<sm_clock>875 MHz</sm_clock>
			<mem_clock>2505 MHz</mem_clock>
			<video_clock>540 MHz</video_clock>
		</clocks>
		<applications_clocks>
			<graphics_clock>562 MHz</graphics_clock>
			<mem_clock>2505 MHz</mem_clock>
		</applications_clocks>
		<default_applications_clocks>
			<graphics_clock>562 MHz</graphics_clock>
			<mem_clock>2505 MHz</mem_clock>
		</default_applications_clocks>
		<max_clocks>
			<graphics_clock>875 MHz</graphics_clock>
			<sm_clock>875 MHz</sm_clock>
			<mem_clock>2505 MHz</mem_clock>
			<video_clock>540 MHz</video_clock>
		</max_clocks>
		<max_customer_boost_clocks>
			<graphics_clock>N/A</graphics_clock>
		</max_customer_boost_clocks>
		<clock_policy>
			<auto_boost>On</auto_boost>
			<auto_boost_default>On</auto_boost_default>
		</clock_policy>
		<supported_clocks>
			<supported_mem_clock>
				<value>2505 MHz</value>
				<supported_graphics_clock>875 MHz</supported_graphics_clock>
				<supported_graphics_clock>862 MHz</supported_graphics_clock>
				<supported_graphics_clock>849 MHz</supported_graphics_clock>
				<supported_graphics_clock>836 MHz</supported_graphics_clock>
				<supported_graphics_clock>823 MHz</supported_graphics_clock>
				<supported_graphics_clock>810 MHz</supported_graphics_clock>
				<supported_graphics_clock>797 MHz</supported_graphics_clock>
				<supported_graphics_clock>784 MHz</supported_graphics_clock>
				<supported_graphics_clock>771 MHz</supported_graphics_clock>
				<supported_graphics_clock>758 MHz</supported_graphics_clock>
				<supported_graphics_clock>745 MHz</supported_graphics_clock>
				<supported_graphics_clock>732 MHz</supported_graphics_clock>
				<supported_graphics_clock>719 MHz</supported_graphics_clock>
				<supported_graphics_clock>705 MHz</supported_graphics_clock>
				<supported_graphics_clock>692 MHz</supported_graphics_clock>
				<supported_graphics_clock>679 MHz</supported_graphics_clock>
				<supported_graphics_clock>666 MHz</supported_graphics_clock>
				<supported_graphics_clock>653 MHz</supported_graphics_clock>
				<supported_graphics_clock>640 MHz</supported_graphics_clock>
				<supported_graphics_clock>627 MHz</supported_graphics_clock>
				<supported_graphics_clock>614 MHz</supported_graphics_clock>
				<supported_graphics_clock>601 MHz</supported_graphics_clock>
				<supported_graphics_clock>588 MHz</supported_graphics_clock>
				<supported_graphics_clock>575 MHz</supported_graphics_clock>
				<supported_graphics_clock>562 MHz</supported_graphics_clock>
			</supported_mem_clock>
			<supported_mem_clock>
				<value>324 MHz</value>
				<supported_graphics_clock>324 MHz</supported_graphics_clock>
			</supported_mem_clock>
		</supported_clocks>
		<processes>
		</processes>
		<accounted_processes>
		</accounted_processes>
	</gpu>

</nvidia_smi_log>
"""

DETAILS_RESPONSE_BODY = (
    b'{"instance": {"attributes": {"framework": "PyTorch:1.4", '
    b'"install-nvidia-driver": "True", "notebooks-api": "PROD", "proxy-mode": '
    b'"service_account", "proxy-url": '
    b'"44dcc67790e9c556-dot-us-west1.notebooks.googleusercontent.com", '
    b'"shutdown-script": "timeout 30 gcloud compute instances remove-metadata '
    b'pytorch --keys=proxy-url --zone us-west1-b", "title": '
    b'"PyTorch/fastai/CUDA10.0", "version": "44"}, "cpuPlatform": "Intel '
    b'Broadwell", "description": "", "disks": [{"deviceName": '
    b'"persistent-disk-0", "index": 0, "mode": "READ_WRITE", "type": '
    b'"PERSISTENT"}], "guestAttributes": {}, "hostname": '
    b'"pytorch.c.test-project.internal", "id": 127546640929027970, "image": '
    b'"projects/deeplearning-platform-release/global/images/pytorch-1-4-cu101-notebooks-20200302",'
    b' "legacyEndpointAccess": {"0.1": 0, "v1beta1": 0}, "licenses": [{"id": '
    b'"1000205"}, {"id": "5638175847114525401"}, {"id": '
    b'"6695225044516563714"}], "machineType": {"name": "n1-standard-4", '
    b'"description": "4 vCPU, 15 GB RAM"}, "maintenanceEvent": "NONE", "name":'
    b' "pytorch", "networkInterfaces": [{"accessConfigs": [{"externalIp": '
    b'"34.83.159.72", "type": "ONE_TO_ONE_NAT"}], "dnsServers": '
    b'["169.254.169.254"], "forwardedIps": [], "gateway": "10.138.0.1", "ip": '
    b'"10.138.0.16", "ipAliases": [], "mac": "42:01:0a:8a:00:10", "mtu": 1460,'
    b' "network": "projects/123456/networks/default", "subnetmask": '
    b'"255.255.240.0", "targetInstanceIps": []}], "preempted": "FALSE", '
    b'"remainingCpuTime": -1, "scheduling": {"automaticRestart": "TRUE", '
    b'"onHostMaintenance": "TERMINATE", "preemptible": "FALSE"}, '
    b'"serviceAccounts": {"123456-compute@developer.gserviceaccount.com": '
    b'{"aliases": ["default"], "email": '
    b'"123456-compute@developer.gserviceaccount.com", "scopes": '
    b'["https://www.googleapis.com/auth/cloud-platform", '
    b'"https://www.googleapis.com/auth/userinfo.email"]}, "default": '
    b'{"aliases": ["default"], "email": '
    b'"123456-compute@developer.gserviceaccount.com", "scopes": '
    b'["https://www.googleapis.com/auth/cloud-platform", '
    b'"https://www.googleapis.com/auth/userinfo.email"]}}, "tags": '
    b'["deeplearning-vm", "notebook-instance"], "virtualClock": {"driftToken":'
    b' "0"}, "zone": "projects/123456/zones/us-west1-b"}, "oslogin": '
    b'{"authenticate": {"sessions": {}}}, "project": {"attributes": {}, '
    b'"numericProjectId": 123456, "projectId": "test-project"}, '
    b'"utilization": {"cpu": 50, "memory": 16}, "gpu": {"cuda_version":'
    b' "10.1", "driver_version": "418.87.01", "gpu": 100, "count": 1, "memory":'
    b' 6, "name": "Tesla K80", "temperature": "42 C"}}')
