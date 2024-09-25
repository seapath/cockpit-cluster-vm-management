/*
 * Copyright (C) 2017-2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from "cockpit";
import React from "react";
import PropTypes from 'prop-types';

import { Terminal } from "cockpit-components-terminal.jsx";
import {
  Button,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  TextInput
} from '@patternfly/react-core';
import { CheckIcon } from "@patternfly/react-icons";


export default class VMConsole extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: null,
      libvirtUser: this.props.libvirtUser,
      tmpLibvirtUser: this.props.libvirtUser,
      channel: undefined,
      availableVM: [""],
      isSelectOpen: false,
      VMNode: null,
      VMName: this.props.virtualMachineName,
    };

    this.onDisconnect = this.onDisconnect.bind(this);
    this.switchVMConsole = this.switchVMConsole.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSelectToggle = this.handleSelectToggle.bind(this);
    this.handleLibvirtUserUpdate = this.handleLibvirtUserUpdate.bind(this);
  }

  async componentDidMount() {
    const { VMName } = this.state;

    const user = await cockpit.user();
    const VMNode = await this.fetchVmNode(VMName);
    const availableVM = await this.fetchVmList();

    const channel = this.createChannel(user, VMName, VMNode);

    this.setState({ user, channel, VMNode, availableVM });
  }

  async fetchVmNode(virtualMachineName) {
    try {
      const output = await cockpit.spawn(["crm", "resource", "locate", virtualMachineName], { superuser: "try" });
      // Ex: "resource vmD is running on: node2" --> "node2"
      const regex = /:\s*(\S+)\s*/;
      const match = regex.exec(output);
      return match ? match[1] : null;
    } catch (error) {
      console.error(`Error retrieving the node associated to the VM ${virtualMachineName}:`, error);
      return null;
    }
  }

  async fetchVmList() {
    try {
      const output = await cockpit.spawn(["vm-mgr", "list"], { superuser: "try" });
      return output.trim().split('\n');
    } catch (error) {
      console.error(`Error retrieving the list of VM:`, error);
      return null;
    }
  }

  createChannel(user, virtualMachineName, virtualMachineNode) {
    const { libvirtUser } = this.state;

    return cockpit.channel({
      payload: "stream",
      spawn: [
        "virsh",
        "--connect",
        `qemu+ssh://${libvirtUser}@${virtualMachineNode}/system`,
        "console",
        virtualMachineName,
      ],
      directory: user.home || "/",
      pty: true,
    });
  }

  switchVMConsole(vmName) {
    cockpit.location.go(["console", vmName]);
  }

  handleSelectToggle() {
    this.setState({ isSelectOpen: !this.state.isSelectOpen });
  }

  handleSelect(event, value) {
    this.setState({ VMName: value, isSelectOpen: false }, () => {
      this.switchVMConsole(this.state.VMName);
    });
  }

  handleLibvirtUserChange = (e) => {
    this.setState({ tmpLibvirtUser: e.target.value }, () => {
      // Prevent the terminal from taking focus
      this.libvirtUserInput.focus();
    });
  }

  handleLibvirtUserUpdate() {
    const { user, VMName, VMNode } = this.state;

    this.setState({ libvirtUser: this.state.tmpLibvirtUser }, () => {

      const channel = this.createChannel(user, VMName, VMNode);
      this.setState({ channel });
    });
  }

  onDisconnect() {
    const channel = this.state.channel;

    if (channel) {
      channel.close();
      this.setState({ channel: null });
    }
    cockpit.location.go([""]);
  }

  render() {
    const { channel, availableVM, isSelectOpen, VMName, tmpLibvirtUser } = this.state;

    let terminal = <span>{"Loading..."}</span>;
    if (channel) {
      terminal = (
        <Terminal
          channel={channel}
          parentId="vm-terminal"
        />
      );
    }

    return (
      <div>
        <h1 className="title1">VM Console: &nbsp;
          <Select
            isOpen={isSelectOpen}
            selected={VMName}
            toggle={toggleRef => (
              <MenuToggle
                className="title1Font"
                ref={toggleRef}
                onClick={this.handleSelectToggle}
                isExpanded={isSelectOpen}
              >
                {VMName}
              </MenuToggle>
            )}
            onSelect={this.handleSelect}
          >
            <SelectList>
              {availableVM.map(vmName => (
                <SelectOption key={vmName} value={vmName}>
                  {vmName}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', width: '300px', marginBottom: '3px' }}>
          <label style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>
            Remote User:
          </label>
          <TextInput
            id="libvirt-user"
            ref={(input) => { this.libvirtUserInput = input; }}
            value={tmpLibvirtUser}
            onChange={this.handleLibvirtUserChange}
          />
          <Button style={{ marginLeft: '10px' }} variant="primary" onClick={this.handleLibvirtUserUpdate}>
            <CheckIcon />
          </Button>
        </div>

        <div id="vm-terminal">
          {terminal}
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <Button variant="secondary" onClick={this.onDisconnect}>
            Back
          </Button>
        </div>
      </div>
    );
  }
}

VMConsole.propTypes = {
  libvirtUser: PropTypes.string.isRequired,
  virtualMachineName: PropTypes.string.isRequired,
}
