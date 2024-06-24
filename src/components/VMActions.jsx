/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Spinner } from '@patternfly/react-core';
import VMSnapshot from './VMSnapshot';
import SelectionModal from './selectionModal';

class VMActions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDisabled: true,
      isLoading: false,
      isSnapshotCreatorOpen: false,
      isSnapshotApplyOpen: false,
      isMigrationOpen: false,
      snapshotList: [],
      nodeList: [],
    };
    this.pollingInterval = null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedVM !== this.props.selectedVM) {
      this.setState({ isDisabled: this.props.selectedVM ? false : true });
    }
  }

  handleActionVmMgr = (action, args = []) => {
    const { selectedVM, refreshVMList } = this.props;
    if (selectedVM) {
      this.setState({ isLoading: true }, () => {
        cockpit.spawn(["vm-mgr", action, "-n", selectedVM.name, ...args], { superuser: "try" })
          .then(() => {
            refreshVMList();
            this.setState({ isLoading: false });
          })
          .catch(error => {
            console.error("Error executing VM action:", error);
            this.setState({ isLoading: false });
          });
      });
    }
  };

  handleActionCrm = (action, args = []) => {
    const { selectedVM, refreshVMList } = this.props;
    if (selectedVM) {
      this.setState({ isLoading: true }, () => {
        cockpit.spawn(["crm", "resource", action, selectedVM.name, ...args], { superuser: "try" })
          .then(() => {
            refreshVMList();
            if (action === 'move') {
              this.startPollingMigrationStatus();
              }
            this.setState({ isLoading: false });
          })
          .catch(error => {
            console.error("Error executing VM action:", error);
            this.setState({ isLoading: false });
          });
      });
    }
  };

  startPollingMigrationStatus = () => {
    const { VMlist, updateSelectedVM } = this.props;
    updateSelectedVM(VMlist);
    this.pollingInterval = setInterval(this.checkMigrationStatus, 3000);
  };

  checkMigrationStatus = async () => {
    const { selectedVM, VMlist, refreshVMList, updateSelectedVM } = this.props;

    refreshVMList();
    const nextState = VMlist.find(vm => vm.id === selectedVM.id).state.trim();

    if (selectedVM.state.trim() === "Migrating" && nextState !== "Migrating") {
      clearInterval(this.pollingInterval);
    }
    updateSelectedVM(VMlist);
  };

// Snapshot creation

  openVMSnapshot = () => {
    this.setState({ isSnapshotCreatorOpen: true });
  };

  closeVMSnapshot = () => {
    this.setState({ isSnapshotCreatorOpen: false });
  };

  handleSnapshotConfirm = (snapshotName) => {
    this.setState({ isSnapshotCreatorOpen: false }, () => {
      this.handleActionVmMgr('create_snapshot', ['--snap_name', snapshotName]);
    });
  };

// Rollback VM from snapshot

  openVMSnapshotApply = async () => {
    const snapshotList = await this.getVMSnapshotList();
    this.setState({
      isSnapshotApplyOpen: true,
      snapshotList,
    });
  };

  closeVMSnapshotApply = () => {
    this.setState({ isSnapshotApplyOpen: false });
  };

  handleSnapshotApplyConfirm = (snapshotName) => {
    this.setState({ isSnapshotApplyOpen: false }, () => {
      this.handleActionVmMgr('rollback', ['--snap_name', snapshotName]);
    });
  };

  getVMSnapshotList = async () => {
    const { selectedVM } = this.props;

    try {
      const output = await cockpit.spawn(["vm-mgr", "list_snapshots", "-n", selectedVM.name], { superuser: "try" });
      let snapshotList = output.trim().replace(/[\[\]']+/g, '').split(", ");
      return snapshotList;
    } catch (error) {
      console.error("Error executing VM action:", error);
      return [];
    }
  };

  // VM migration

  openVMMigration = async () => {
    const nodeList = await this.getNodeList();
    this.setState({
      isMigrationOpen: true,
      nodeList,
    });
  };

  closeVMMigration = () => {
    this.setState({ isMigrationOpen: false });
  };

  handleMigrationConfirm = (node) => {
    this.setState({ isMigrationOpen: false }, () => {
      this.handleActionCrm('move', [node])
    });
  };

  getNodeList = async () => {
    const { selectedVM } = this.props;
    try {
      const output = await cockpit.spawn(["crm", "status", "--exclude=all", "--include=nodes"], {superuser: "try"});

      const onlineNodesRegex = /\* Online: \[\s*([\w\s]+?)\s*\]/;
      const onlineMatch = onlineNodesRegex.exec(output);
      // If there is a match with the regex and the online node list is not empty, we collect them in an array
      const onlineNodes = onlineMatch && onlineMatch[1] ? onlineMatch[1].split(' ') : [];

      return onlineNodes;
    } catch (error) {
      console.error("Error executing VM action:", error);
      return [];
    }
  };

  render() {
    const { isDisabled, isLoading, isSnapshotCreatorOpen, isSnapshotApplyOpen, snapshotList, isMigrationOpen, nodeList } = this.state;
    return (
      <React.Fragment>
        <br />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              id="action-start"
              isDisabled={isDisabled || isLoading}
              variant="primary"
              onClick={() => this.handleActionVmMgr('start')}
            >
              Start
            </Button>
            <Button
              id="action-stop"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('stop')}
            >
              Stop
            </Button>
            <Button
              id="action-stop-force"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('stop', ['--force'])}
              isDanger
            >
              Force Stop
            </Button>
            <Button
              id="action-enable"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('enable')}
            >
              Enable
            </Button>
            <Button
              id="action-disable"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('disable')}
            >
              Disable
            </Button>
            <Button
              id="action-disable-force"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionVmMgr('disable', ['--force'])}
              isDanger
            >
              Force Disable
            </Button>
            <Button
              id="action-restart"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={() => this.handleActionCrm('restart')}
            >
              Restart
            </Button>
            <Button
              id="action-migrate"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={this.openVMMigration}
            >
              Migrate
            </Button>
            <Button
              id="action-remove"
              isDisabled={isDisabled || isLoading}
              variant="danger"
              onClick={() => this.handleActionVmMgr('remove')}
            >
              Remove
            </Button>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Button
              id="action-snapshot"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={this.openVMSnapshot}
            >
              Snapshot
            </Button>
            <Button
              id="action-snapshot-apply"
              isDisabled={isDisabled || isLoading}
              variant="secondary"
              onClick={this.openVMSnapshotApply}
            >
              Apply Snapshot
            </Button>
          </div>
          {isLoading && (
            <div style={{ marginTop: '20px' }}>
              <Spinner size="xl" />
            </div>
          )}
        </div>
        <VMSnapshot
          isOpen={isSnapshotCreatorOpen}
          onConfirm={this.handleSnapshotConfirm}
          onCancel={this.closeVMSnapshot}
        />
        <SelectionModal
          title="Apply Snapshot"
          isOpen={isSnapshotApplyOpen}
          options={snapshotList}
          onConfirm={this.handleSnapshotApplyConfirm}
          onCancel={this.closeVMSnapshotApply}
        />
        <SelectionModal
          title="VM Migration"
          isOpen={isMigrationOpen}
          options={nodeList}
          onConfirm={this.handleMigrationConfirm}
          onCancel={this.closeVMMigration}
        />
      </React.Fragment>
    );
  }
}

export default VMActions;
