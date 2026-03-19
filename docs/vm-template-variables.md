# VM Creation Form to Template Variable Mapping

This document maps the VMCreator form fields to the corresponding variables
used in the `guest.xml.j2` Jinja2 template.

## Core Fields

| Form Field | Template Variable | Notes |
|---|---|---|
| VM Name | `vm.inventory_hostname` | Used as `<name>` in domain XML |
| vcpuCount | `vm.nb_cpu` | Fallback when `cpuset` is not defined |
| cpuPinning | `vm.cpuset` | RT only; also adds `isolated` to `vm_features` |
| hostPassthrough | `cpu mode` attribute | `host-passthrough` (RT) vs `host-model` |
| rtPriority | `vm.rt_priority` | RT only, default 1 |
| emulatorPin | `vm.emulatorpin` | RT only |
| memorySize | `vm.memory` | MiB normally, GiB when hugepages enabled |

## Feature Flags (vm_features)

| Form Field | vm_features entry | Notes |
|---|---|---|
| Real-time | `rt` | Enables RT scheduling, PMU off, host-passthrough |
| balloon | `memballoon` | Enables virtio memballoon device |
| hugepages | — | Uses `dpdk`-like memory path (1G hugepages) |
| video (VNC) | `graphic-console` | Enables VNC graphics + virtio video |

## Network Interfaces

| Interface Type | Template Variable | Fields |
|---|---|---|
| Bridge | `vm.bridges[]` | `name` (source), `mac_address`, `type` (virtualport), `vlan.vlan_tag` |
| MacvTap | `vm.direct_interfaces[]` | `source`, `mode`, `mac_address` |
| PCI passthrough | `vm.pci_passthrough[]` | Parsed from address string: `domain`, `bus`, `slot`, `function` |
| Libvirt network | `vm.sriov[]` | Network name passed as string |
| SR-IOV pool | `vm.sriov[]` | Pool name passed as string (same template path as libvirt network) |
