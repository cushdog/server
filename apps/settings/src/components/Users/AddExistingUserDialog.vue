<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog class="dialog"
		size="small"
		:name="t('settings', 'Add existing account')"
		out-transition
		v-on="$listeners">
		<form id="add-existing-user-form"
			class="dialog__form"
			@submit.prevent="submit">
			<NcSelect v-model="selectedUser"
				class="dialog__select"
				:options="possibleUsers"
				:placeholder="t('settings', 'Search accounts')"
				user-select
				label="displayname"
				@search="searchUsers" />
			<NcSelect v-model="selectedGroup"
				class="dialog__select"
				:options="availableGroups"
				:placeholder="t('settings', 'Select group')"
				label="name"
				:disabled="preselectedGroup"
				:clearable="false" />
		</form>
		<template #actions>
			<NcButton class="dialog__submit"
				form="add-existing-user-form"
				type="primary"
				native-type="submit">
				{{ t('settings', 'Add to group') }}
			</NcButton>
		</template>
	</NcDialog>
</template>

<script lang='ts'>
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import type { IGroup } from '../../views/user-types.d.ts'
import { translate as t } from '@nextcloud/l10n'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import NcButton from '@nextcloud/vue/components/NcButton'
import logger from '../../logger.ts'

export default defineComponent({
	name: 'AddExistingUserDialog',
	components: { NcDialog, NcSelect, NcButton },
	props: {
		group: {
			type: Object as PropType<IGroup | null>,
			default: null,
		},
	},
	data() {
		return {
			possibleUsers: [] as Record<string, unknown>[],
			selectedUser: null as Record<string, unknown> | null,
			availableGroups: [] as IGroup[],
			selectedGroup: null as IGroup | null,
			preselectedGroup: false,
			promise: null as any,
		}
	},
	mounted() {
		// @ts-expect-error: allow untyped $store
		this.availableGroups = this.$store.getters.getSubAdminGroups
		if (this.group) {
			this.selectedGroup = this.group
			this.preselectedGroup = true
		}
	},
	methods: {
		t,
		async searchUsers(query: string) {
			if (this.promise) {
				this.promise.cancel?.()
			}
			try {
				// @ts-expect-error: allow untyped $store
				this.promise = this.$store.dispatch('searchUsers', { offset: 0, limit: 10, search: query })
				const resp = await this.promise
				logger.debug('AddExistingUserDialog searchUsers response', { resp })
				const users = resp?.data ? Object.values(resp.data.ocs.data.users) as Record<string, unknown>[] : []
				logger.debug('AddExistingUserDialog parsed users', { users })
				this.possibleUsers = users
			} catch (error) {
				logger.error(t('settings', 'Failed to search accounts'), { error })
			}
			this.promise = null
		},

		async submit() {
                       if (!this.selectedUser || !this.selectedGroup) {
                               return
                       }
                       const userid = String(this.selectedUser.id)
                       const gid = String(this.selectedGroup.id)
                       try {
                               logger.debug('Adding user to group', { userid, gid })
                               // @ts-expect-error: allow untyped $store
                               await this.$store.dispatch('addUserGroup', { userid, gid })
                               // @ts-expect-error: allow untyped $store
                               if (!this.$store.getters.getUsers.find(u => u.id === userid)) {
                                       // @ts-expect-error: allow untyped $store
                                       const resp = await this.$store.dispatch('getUser', userid)
                                       if (resp) {
                                               // @ts-expect-error: allow untyped $store
                                               this.$store.commit('addUserData', resp)
                                       }
                               }
                               this.$emit('closing')
                       } catch (error) {
                               logger.error(t('settings', 'Failed to add user to group'), { userid, gid, error })
                       }
               },
	},
})
</script>

<style scoped lang="scss">
.dialog {
  &__form {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 8px;
    gap: 4px 0;
  }
  &__select {
    width: 100%;
  }
  &__submit {
    margin-top: 4px;
    margin-bottom: 8px;
  }
}
</style>
