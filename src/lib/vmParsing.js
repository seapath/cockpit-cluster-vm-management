/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Parsing helpers, kept free of React and cockpit so they can be unit tested in
// isolation. They reproduce the output handling the components used to perform
// inline; parseOnlineNodes additionally drops empty entries.

// `vm-mgr list` prints one VM name per line.
export function parseVmNames(output) {
    return output.trim().split('\n').filter((name) => name !== '');
}

// `crm resource locate <vm>` output, e.g.
// "resource vm1 is running on: hyp3".
export function parseResourceLocation(output) {
    const regex = /:\s*(\S+)\s*/g;
    const match = regex.exec(output);
    return match !== null ? match[1] : '-';
}

// `crm configure show` prints one location constraint per line, e.g.
// "location pin-vm1-onhyp3 vm1 resource-discovery=exclusive inf: hyp3".
// Return a new list with `defaultNode` filled in for the VMs found in the
// output.
export function applyDefaultLocations(vmList, output) {
    const regex = /(prefer|pin)-(?:\S+)\s(\S+)\s(?:\S+)\sinf:\s(.+)/g;
    const result = [...vmList];
    let match;
    while ((match = regex.exec(output)) !== null) {
        const locationType = match[1];
        const resourceName = match[2];
        const node = match[3];
        const index = result.findIndex((vm) => vm.name === resourceName);
        if (index !== -1) {
            result[index] = {
                ...result[index],
                defaultNode: locationType + ': ' + node,
            };
        }
    }
    return result;
}

// `vm-mgr list_snapshots` prints a Python-style list, e.g. "['snap1', 'snap2']".
export function parseSnapshotList(output) {
    return output.trim().replace(/[\[\]']+/g, '').split(', ');
}

// `crm status --exclude=all --include=nodes` prints the online node list as
// "* Online: [ hyp1 hyp2 ]".
export function parseOnlineNodes(output) {
    const onlineNodesRegex = /\* Online: \[\s*([\w\-\s]+?)\s*\]/;
    const onlineMatch = onlineNodesRegex.exec(output);
    if (!onlineMatch || !onlineMatch[1]) {
        return [];
    }
    return onlineMatch[1].split(' ').filter((node) => node !== '');
}

// Keep only the nodes a VM can be migrated to, i.e. all but the one it already
// runs on.
export function filterMigratableNodes(nodes, currentNode) {
    return nodes.filter((node) => node.trim() !== currentNode.trim());
}

// Read the role of a resource from `crm_mon --output-as xml`, or null when the
// resource is absent.
export function parseResourceRole(xmlOutput, resourceName) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlOutput, 'text/xml');
    const resource = xml.querySelector(`resource[id="${resourceName}"]`);
    return resource ? resource.getAttribute('role') : null;
}
