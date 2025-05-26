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
    <form id="add-existing-user-form" class="dialog__form" @submit.prevent="submit">
      <NcSelect v-model="selectedUser"
                class="dialog__select"
                :options="possibleUsers"
                :placeholder="t('settings', 'Search accounts')"
                :user-select="true"
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

<script>
import { translate as t } from '@nextcloud/l10n'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import NcButton from '@nextcloud/vue/components/NcButton'
import logger from '../../logger.ts'

export default {
  name: 'AddExistingUserDialog',
  components: { NcDialog, NcSelect, NcButton },
  props: {
    group: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      possibleUsers: [],
      selectedUser: null,
      availableGroups: [],
      selectedGroup: null,
      preselectedGroup: false,
      promise: null,
    }
  },
  mounted() {
    this.availableGroups = this.$store.getters.getSubAdminGroups
    if (this.group) {
      this.selectedGroup = this.group
      this.preselectedGroup = true
    }
  },
  methods: {
    t,
    async searchUsers(query) {
      if (this.promise) {
        this.promise.cancel?.()
      }
      try {
        this.promise = this.$store.dispatch('searchUsers', {
          offset: 0,
          limit: 10,
          search: query,
        })
        const resp = await this.promise
        console.log('🔍 AddExistingUserDialog: Search response:', resp?.data?.ocs?.data?.users)
        
        // Get the users object and convert to array of user objects
        const usersMap = resp?.data?.ocs?.data?.users || {}
        this.possibleUsers = Object.values(usersMap)
        
        console.log('🎯 AddExistingUserDialog: Processed users:', this.possibleUsers)
      } catch (error) {
        logger.error(t('settings', 'Failed to search accounts'), { error })
      }
      this.promise = null
    },
    async submit() {
      if (!this.selectedUser || !this.selectedGroup) {
        return
      }
      try {
        console.debug(this.selectedUser)
        await this.$store.dispatch('addUserGroup', { userid: this.selectedUser.id, gid: this.selectedGroup.id })
        if (!this.$store.getters.getUsers.find(u => u.id === this.selectedUser.id)) {
          const resp = await this.$store.dispatch('getUser', this.selectedUser.id)
          if (resp) {
            this.$store.commit('addUserData', resp)
          }
        }
        this.$emit('closing')
      } catch (error) {
        logger.error(t('settings', 'Failed to add user to group'), { error })
      }
    },
  },
}
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