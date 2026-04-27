/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  FormGroup,
} from '@patternfly/react-core';

class DisplayConfig extends React.Component {
  render() {
    const {
      isSerialConsoleEnabled,
      isVideoEnabled,
      onSerialConsoleChange,
      onVideoChange,
    } = this.props;

    return (
      <>
        <FormGroup label="Display" hasNoPaddingTop>
          <Checkbox
            id="enable-serial-console"
            label="Enable serial console"
            isChecked={isSerialConsoleEnabled}
            onChange={onSerialConsoleChange}
          />
          <Checkbox
            id="enable-video"
            label="Enable video (VNC)"
            isChecked={isVideoEnabled}
            onChange={onVideoChange}
          />
        </FormGroup>
      </>
    );
  }
}

DisplayConfig.propTypes = {
  isSerialConsoleEnabled: PropTypes.bool.isRequired,
  isVideoEnabled: PropTypes.bool.isRequired,
  onSerialConsoleChange: PropTypes.func.isRequired,
  onVideoChange: PropTypes.func.isRequired,
};

export default DisplayConfig;
