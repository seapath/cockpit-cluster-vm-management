/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';

class VMData extends React.Component {
  state = {
    VMlist: [],
  };

  componentDidMount() {
    this.refreshVMList();
  }

  refreshVMList = async () => {
    await this.fetchVmInformations();
  };


  fetchVmInformations = async () => {
    try {
      const output = await cockpit.spawn(["vm-mgr", "list"], { superuser: "try" });
      const vmNames = output.trim().split('\n');

      const VMlist = vmNames.map((name, index) => ({
        id: index + 1,
        name,
        state: "",
        defaultNode: "-",
        currentNode: "-"
      }));

      this.setState({ VMlist });
    } catch (error) {
      console.error("Error retrieving the list of VMs:", error);
    }
  };

  render() {
    return (
      <div>
        {this.props.render(this.state.VMlist, this.refreshVMList)}
      </div>
    );
  }
}

export default VMData;
