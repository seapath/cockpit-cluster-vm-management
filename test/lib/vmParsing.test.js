/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
    applyDefaultLocations,
    filterMigratableNodes,
    parseOnlineNodes,
    parseResourceLocation,
    parseResourceRole,
    parseSnapshotList,
    parseVmNames,
} from '../../src/lib/vmParsing.js';

describe('parseVmNames', () => {
    it('splits the output into one name per line', () => {
        expect(parseVmNames('vm1\nvm2\nvm3')).toEqual(['vm1', 'vm2', 'vm3']);
    });

    it('ignores empty lines and surrounding whitespace', () => {
        expect(parseVmNames('\nvm1\n\nvm2\n')).toEqual(['vm1', 'vm2']);
    });

    it('returns an empty list when nothing is deployed', () => {
        expect(parseVmNames('\n')).toEqual([]);
        expect(parseVmNames('')).toEqual([]);
    });
});

describe('parseResourceLocation', () => {
    it('returns the node the resource runs on', () => {
        expect(parseResourceLocation('resource vm1 is running on: hyp3\n'))
            .toBe('hyp3');
    });

    it('falls back to "-" when the resource is not running', () => {
        expect(parseResourceLocation('resource vm1 is NOT running'))
            .toBe('-');
    });
});

describe('applyDefaultLocations', () => {
    const vmList = [
        { id: 1, name: 'vm1', defaultNode: '-' },
        { id: 2, name: 'vm2', defaultNode: '-' },
    ];

    it('fills defaultNode for prefer constraints', () => {
        const output = 'location prefer-vm1-onhyp2 vm1 resource-discovery=exclusive inf: hyp2\n';
        expect(applyDefaultLocations(vmList, output)).toEqual([
            { id: 1, name: 'vm1', defaultNode: 'prefer: hyp2' },
            { id: 2, name: 'vm2', defaultNode: '-' },
        ]);
    });

    it('fills defaultNode for pin constraints', () => {
        const output = 'location pin-vm2-onhyp1 vm2 resource-discovery=exclusive inf: hyp1\n';
        expect(applyDefaultLocations(vmList, output)).toEqual([
            { id: 1, name: 'vm1', defaultNode: '-' },
            { id: 2, name: 'vm2', defaultNode: 'pin: hyp1' },
        ]);
    });

    it('ignores constraints that do not target a known VM', () => {
        const output = 'location pin-ghost-onhyp2 ghost resource-discovery=exclusive inf: hyp2\n';
        expect(applyDefaultLocations(vmList, output)).toEqual(vmList);
    });

    it('does not mutate the input list', () => {
        const input = [{ id: 1, name: 'vm1', defaultNode: '-' }];
        applyDefaultLocations(input, 'location pin-vm1-onhyp2 vm1 resource-discovery=exclusive inf: hyp2\n');
        expect(input[0].defaultNode).toBe('-');
    });
});

describe('parseSnapshotList', () => {
    it('parses a python-style list', () => {
        expect(parseSnapshotList("['snap1', 'snap2']")).toEqual(['snap1', 'snap2']);
    });

    it('parses a single snapshot', () => {
        expect(parseSnapshotList("['only']")).toEqual(['only']);
    });
});

describe('parseOnlineNodes', () => {
    it('returns the online nodes', () => {
        expect(parseOnlineNodes('...\n* Online: [ hyp1 hyp2 ]\n...'))
            .toEqual(['hyp1', 'hyp2']);
    });

    it('returns an empty list when no node is online', () => {
        expect(parseOnlineNodes('* Online: [ ]')).toEqual([]);
    });

    it('drops the empty entries left by repeated spaces', () => {
        expect(parseOnlineNodes('* Online: [ hyp1  hyp2 ]')).toEqual(['hyp1', 'hyp2']);
    });

    it('returns an empty list when there is no online section', () => {
        expect(parseOnlineNodes('no nodes here')).toEqual([]);
    });
});

describe('filterMigratableNodes', () => {
    it('removes the node the VM already runs on', () => {
        expect(filterMigratableNodes(['hyp1', 'hyp2', 'hyp3'], 'hyp2'))
            .toEqual(['hyp1', 'hyp3']);
    });

    it('handles surrounding whitespace', () => {
        expect(filterMigratableNodes([' hyp1'], 'hyp1 ')).toEqual([]);
    });
});

describe('parseResourceRole', () => {
    const xml = `<?xml version="1.0"?>
        <crm_mon>
          <resources>
            <resource id="vm1" role="Started" />
            <resource id="vm2" role="Stopped" />
          </resources>
        </crm_mon>`;

    it('returns the role of the requested resource', () => {
        expect(parseResourceRole(xml, 'vm1')).toBe('Started');
        expect(parseResourceRole(xml, 'vm2')).toBe('Stopped');
    });

    it('returns null when the resource is absent', () => {
        expect(parseResourceRole(xml, 'vm3')).toBeNull();
    });
});
