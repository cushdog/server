/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import AddExistingUserDialog from './AddExistingUserDialog.vue'

const store = {
	dispatch: vi.fn(),
	getters: {
		getSubAdminGroups: [{ id: 'g1', name: 'Group 1' }],
		getUsers: [],
	},
	commit: vi.fn(),
}

describe('AddExistingUserDialog', () => {
	it('preselects passed group', () => {
		const wrapper = mount(AddExistingUserDialog, {
			props: { group: { id: 'g1', name: 'Group 1' } },
			global: { mocks: { $store: store } },
		})

		const vm = wrapper.vm as any
		expect(vm.selectedGroup).toEqual({ id: 'g1', name: 'Group 1' })
		expect(vm.preselectedGroup).toBe(true)
	})
})
