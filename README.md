<!-- Copyright (C) 2024 Savoir-faire Linux Inc.
SPDX-License-Identifier: Apache-2.0 -->

# cockpit-cluster-vm-management

This is a [Cockpit](https://cockpit-project.org/) plugin to manage Virtual Machines (VM) on a Seapath cluster.

Features of the plugin:
- Perform operations on deployed VM (Start, Stop, Enable, Disable, Restart, Migrate, Snapshot, Remove)
- Upload Qcow2 and XML files
- Create VM from existing Qcow2 and XML files

This plugin requires administrative access.

## Dependancies

[vm_manager](https://github.com/seapath/vm_manager) tool used to manage VM on a Hypervisor.

## Getting and building the source

This React project uses npm as package manager.

The first build of the plugin requires to run the following command that will install the dependances defined in the package.json. It will also build the sources on the directory /dist.
```
npm run init
```

To rebuild the project, the script build.js can be used using:
```
npm run build
```

The build files and the dependances can be removed using:
```
npm run clean
```

## Installing

To install this Cockpit plugin, the build sources located in the /dist directory must be copied to `/usr/share/cockpit/cockpit-cluster-vm-management`.
The installation can be verified by looking at the list of cockpit packages given by `cockpit-bridge --packages`.

The following ansible playbook can also be used:

```YAML
---
- name: cockpit plugins installation
  hosts:
    - cluster_machines
  become: true
  vars:
    cockpit_plugin_path: "/usr/share/cockpit"
  tasks:
    - name: Check if cockpit is installed
      command: which cockpit-bridge
      register: cockpit_status

    - name: Install plugin
      ansible.builtin.copy:
        src: dist_directory/
        dest: "{{ cockpit_plugin_path }}/cockpit-cluster-vm-management"
        mode: '644'
        owner: root
      when: cockpit_status.rc == 0


```