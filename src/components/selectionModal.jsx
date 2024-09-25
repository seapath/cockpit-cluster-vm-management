/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalVariant, Button, Dropdown, MenuToggle, DropdownItem, DropdownList } from '@patternfly/react-core';

class SelectionModal extends React.Component {
  state = {
    selectedItem: '',
    isDropdownOpen: false,
  };

  handleDropdownToggle = () => {
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  };

  handleDropdownSelect = (selectedItem) => {
    this.setState({ selectedItem, isDropdownOpen: false });
  };

  handleConfirm = () => {
    const { selectedItem } = this.state;
    this.props.onConfirm(selectedItem);
    this.setState({ selectedItem: '' });
  };

  handleCancel = () => {
    this.setState({ selectedItem: '', isDropdownOpen: false });
    this.props.onCancel();
  };

  render() {
    const { isOpen, options, title } = this.props;
    const { selectedItem, isDropdownOpen } = this.state;

    return (
      <Modal
        title={title}
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={this.handleCancel}
        actions={[
          <Button key="confirm" variant="primary" onClick={this.handleConfirm}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={this.handleCancel}>
            Cancel
          </Button>
        ]}
      >
        <Dropdown
          isOpen={isDropdownOpen}
          onSelect={this.handleDropdownSelect}
          onOpenChange={isOpen => this.setState({ isDropdownOpen: isOpen })}
          toggle={toggleRef => (
            <MenuToggle ref={toggleRef} onClick={this.handleDropdownToggle} isExpanded={isOpen}>
              {selectedItem || "Select an option"}
            </MenuToggle>
          )}
          ouiaId="BasicDropdown"
          shouldFocusToggleOnSelect
        >
          <DropdownList>
            {options.map((option, index) => (
              <DropdownItem key={index} onClick={() => this.handleDropdownSelect(option)}>
                {option}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      </Modal>
    );
  }
}

SelectionModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  title: PropTypes.string.isRequired
}

export default SelectionModal;
