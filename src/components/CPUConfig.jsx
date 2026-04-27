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

class CPUConfig extends React.Component {
  render() {
    const {
      vcpuCount,
      hostPassthrough,
      isRealtime,
      cpuPinning,
      rtPriority,
      emulatorPin,
      onVcpuCountChange,
      onHostPassthroughChange,
      onCpuPinningChange,
      onRtPriorityChange,
      onEmulatorPinChange,
    } = this.props;

    return (
      <>
        <FormGroup label="Number of vCPUs" fieldId="vcpu-count">
          <TextInput
            id="vcpu-count"
            type="number"
            min={1}
            value={vcpuCount}
            onChange={onVcpuCountChange}
          />
        </FormGroup>

        <Checkbox
          id="host-passthrough"
          label="Copy host CPU configuration (host-passthrough)"
          isChecked={hostPassthrough}
          isDisabled={isRealtime}
          onChange={onHostPassthroughChange}
        />

        {isRealtime && (
          <>
            {cpuPinning.map((cpuset, index) => (
              <FormGroup
                key={index}
                label={`vCPU ${index} → cpuset`}
                fieldId={`cpu-pinning-${index}`}
              >
                <TextInput
                  id={`cpu-pinning-${index}`}
                  value={cpuset}
                  onChange={(e) => onCpuPinningChange(index, e.target.value)}
                  placeholder="e.g. 2"
                />
              </FormGroup>
            ))}

            <FormGroup label="RT priority" fieldId="rt-priority">
              <TextInput
                id="rt-priority"
                type="number"
                min={1}
                value={rtPriority}
                onChange={onRtPriorityChange}
              />
            </FormGroup>

            <FormGroup label="Emulator pin cpuset" fieldId="emulator-pin">
              <TextInput
                id="emulator-pin"
                value={emulatorPin}
                onChange={onEmulatorPinChange}
                placeholder="e.g. 0-1"
              />
            </FormGroup>
          </>
        )}
      </>
    );
  }
}

CPUConfig.propTypes = {
  vcpuCount: PropTypes.number.isRequired,
  hostPassthrough: PropTypes.bool.isRequired,
  isRealtime: PropTypes.bool.isRequired,
  cpuPinning: PropTypes.arrayOf(PropTypes.string).isRequired,
  rtPriority: PropTypes.number.isRequired,
  emulatorPin: PropTypes.string.isRequired,
  onVcpuCountChange: PropTypes.func.isRequired,
  onHostPassthroughChange: PropTypes.func.isRequired,
  onCpuPinningChange: PropTypes.func.isRequired,
  onRtPriorityChange: PropTypes.func.isRequired,
  onEmulatorPinChange: PropTypes.func.isRequired,
};

export default CPUConfig;
