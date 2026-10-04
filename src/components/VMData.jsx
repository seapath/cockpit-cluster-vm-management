/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';
import PropTypes from 'prop-types';
import { applyDefaultLocations, parseResourceLocation, parseVmNames } from '../lib/vmParsing';

class VMData extends React.Component {
  state = {
    VMlist: [],
  };

  componentDidMount() {
    this.refreshVMList();
  }

  refreshVMList = async () => {
    await this.fetchVmInformations();
    await this.fetchVmDefaultLocation();
  };


  fetchVmInformations = async () => {
    try {
      const output = await cockpit.spawn(["vm-mgr", "list"], { superuser: "try" });
      const vmNames = parseVmNames(output);

      if (vmNames.length === 0) {
        this.setState({ VMlist: [] });
        return;
      }

      const VMlist = vmNames.map((name, index) => ({
        id: index + 1,
        name,
        state: "",
        defaultNode: "-",
        currentNode: "-"
      }));

      const statusPromises = VMlist.map((vm, index) =>
        cockpit.spawn(["vm-mgr", "status", "--name", vm.name], { superuser: "try" })
          .then(state => ({ index, state }))
          .catch(error => {
            console.error(`Error retrieving VM state ${vm.name}:`, error);
            return { index, state: "Error" };
          })
      );

      const locationPromises = VMlist.map((vm, index) =>
        cockpit.spawn(["crm", "resource", "locate", vm.name], { superuser: "try" })
          .then(output => {
            const currentNode = parseResourceLocation(output);
            return { index, currentNode };
          })
          .catch(error => {
            console.error(`Error retrieving VM state ${vm.name}:`, error);
            return { index, currentNode: "Error" };
          })
      );

      // Use Promises.all instead of a loop with "await cockpit.spawn()" to execute operations in parallel
      const stateResults = await Promise.all(statusPromises);
      const locationResults = await Promise.all(locationPromises);

      stateResults.forEach(({ index, state }) => {
        VMlist[index].state = state;
      });

      locationResults.forEach(({ index, currentNode }) => {
        VMlist[index].currentNode = currentNode;
      });

      this.setState({ VMlist });
    } catch (error) {
      console.error("Error retrieving the list of VMs:", error);
    }
  };

  fetchVmDefaultLocation = async () => {
    try {
      const output = await cockpit.spawn(["crm", "configure", "show"], { superuser: "try"});
      // Look for the occurrences of "prefer" or "pin" to get information about
      // the collocation constraint of the deployed VMs (VM name + collocation
      // type and associated node).
      const VMlist = applyDefaultLocations(this.state.VMlist, output);
      this.setState({ VMlist });
    } catch (error) {
      console.error("Error retrieving default VM locations:", error);
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

VMData.propTypes = {
  render: PropTypes.func.isRequired,
}

export default VMData;
