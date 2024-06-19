/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import VMData from './VMData';
import VMTable from './VMTable';
import VMActions from './VMActions';

class VMManager extends React.Component {
  state = {
    selectedVM: null,
  };

  handleRowClick = (vm) => {
    this.setState({ selectedVM: vm });
  };

  updateSelectedVM = (VMlist) => {
    if (this.state.selectedVM) {
      const updatedSelectedVM = VMlist.find(vm => vm.id === this.state.selectedVM.id);
      this.setState({ selectedVM: updatedSelectedVM });
    }
  };

  render() {
    const { selectedVM } = this.state;

    return (
      <VMData render={(VMlist, refreshVMList) => (
        <div>
          <VMTable VMlist={VMlist} selectedVM={selectedVM} onRowClick={this.handleRowClick} />
          <VMActions VMlist={VMlist} selectedVM={selectedVM} refreshVMList={refreshVMList} updateSelectedVM={this.updateSelectedVM}/>
        </div>
      )} />
    );
  }
}

export default VMManager;
