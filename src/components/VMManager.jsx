/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import VMData from './VMData';
import VMTable from './VMTable';
import VMActions from './VMActions';
import VMCreator from './VMCreator';

import { Button } from '@patternfly/react-core';

class VMManager extends React.Component {
  state = {
    selectedVM: null,
    isVMCreatorOpen: false,
  };

  updateSelectedVM = (vm) => {
    this.setState({ selectedVM: vm });
  };

  openVMCreator = () => {
    this.setState({ isVMCreatorOpen: true });
  };

  closeVMCreator = () => {
    this.setState({ isVMCreatorOpen: false });
  };

  render() {
    const { selectedVM, isVMCreatorOpen } = this.state;

    return (
      <VMData render={(VMlist, refreshVMList) => (
        <div>
          <div style={{ textAlign: 'right',  marginRight: '50px', marginBottom: '10px' }}>
            <Button variant="primary" onClick={this.openVMCreator}>Create VM</Button>
          </div>
          <VMTable VMlist={VMlist} selectedVM={selectedVM} onRowClick={this.updateSelectedVM} />
          <VMActions
            VMlist={VMlist}
            selectedVM={selectedVM}
            refreshVMList={refreshVMList}
            updateSelectedVM={this.updateSelectedVM}
          />
          <VMCreator
            isOpen={isVMCreatorOpen}
            onClose={this.closeVMCreator}
            refreshVMList={refreshVMList}
          />
        </div>
      )} />
    );
  }
}

export default VMManager;
