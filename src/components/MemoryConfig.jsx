/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  FormGroup,
  TextInput,
} from '@patternfly/react-core';

class MemoryConfig extends React.Component {
  render() {
    const {
      memorySize,
      isRealtime,
      isBalloonEnabled,
      balloonMinAllocation,
      isHugepagesEnabled,
      hugepagesCount,
      onMemorySizeChange,
      onBalloonChange,
      onBalloonMinAllocationChange,
      onHugepagesChange,
      onHugepagesCountChange,
    } = this.props;

    return (
      <>
        {isRealtime && isHugepagesEnabled ? (
          <FormGroup label="Number of 1GB hugepages" fieldId="hugepages-count">
            <TextInput
              id="hugepages-count"
              type="number"
              min={1}
              value={hugepagesCount}
              onChange={onHugepagesCountChange}
            />
          </FormGroup>
        ) : (
          <FormGroup label="Memory size (MiB)" fieldId="memory-size">
            <TextInput
              id="memory-size"
              type="number"
              min={1}
              value={memorySize}
              onChange={onMemorySizeChange}
            />
          </FormGroup>
        )}

        {!isRealtime && (
          <>
            <Checkbox
              id="enable-balloon"
              label="Enable balloon"
              isChecked={isBalloonEnabled}
              onChange={onBalloonChange}
            />
            {isBalloonEnabled && (
              <FormGroup label="Minimal allocation (MiB)" fieldId="balloon-min-allocation">
                <TextInput
                  id="balloon-min-allocation"
                  type="number"
                  min={1}
                  value={balloonMinAllocation}
                  onChange={onBalloonMinAllocationChange}
                />
              </FormGroup>
            )}
          </>
        )}

        {isRealtime && (
          <Checkbox
            id="enable-hugepages"
            label="Use 1G hugepages"
            isChecked={isHugepagesEnabled}
            onChange={onHugepagesChange}
          />
        )}
      </>
    );
  }
}

MemoryConfig.propTypes = {
  memorySize: PropTypes.number.isRequired,
  isRealtime: PropTypes.bool.isRequired,
  isBalloonEnabled: PropTypes.bool.isRequired,
  balloonMinAllocation: PropTypes.number.isRequired,
  isHugepagesEnabled: PropTypes.bool.isRequired,
  hugepagesCount: PropTypes.number.isRequired,
  onMemorySizeChange: PropTypes.func.isRequired,
  onBalloonChange: PropTypes.func.isRequired,
  onBalloonMinAllocationChange: PropTypes.func.isRequired,
  onHugepagesChange: PropTypes.func.isRequired,
  onHugepagesCountChange: PropTypes.func.isRequired,
};

export default MemoryConfig;
