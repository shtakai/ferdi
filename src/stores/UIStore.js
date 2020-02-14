import { theme } from '@meetfranz/theme';
import { remote } from 'electron';
import {
  action, computed, observable, reaction,
} from 'mobx';
import { isMac } from '../environment';
import Store from './lib/Store';


const { nativeTheme, systemPreferences } = remote;

export default class UIStore extends Store {
  @observable showServicesUpdatedInfoBar = false;

  @observable shouldUseDarkColors = nativeTheme.shouldUseDarkColors;

  constructor(...args) {
    super(...args);

    // Register action handlers
    this.actions.ui.openSettings.listen(this._openSettings.bind(this));
    this.actions.ui.closeSettings.listen(this._closeSettings.bind(this));
    this.actions.ui.toggleServiceUpdatedInfoBar.listen(
      this._toggleServiceUpdatedInfoBar.bind(this),
    );

    // Listen for theme change on MacOS
    if (isMac) {
      systemPreferences.subscribeNotification(
        'AppleInterfaceThemeChangedNotification',
        () => {
          this.shouldUseDarkColors = nativeTheme.shouldUseDarkColors;
          this.actions.service.shareSettingsWithServiceProcess();
        },
      );
    }
  }

  setup() {
    reaction(
      () => this.isDarkThemeActive,
      () => this._setupThemeInDOM(),
      { fireImmediately: true },
    );
  }

  @computed get showMessageBadgesEvenWhenMuted() {
    const settings = this.stores.settings.all;

    return (
      (settings.app.isAppMuted && settings.app.showMessageBadgeWhenMuted)
      || !settings.app.isAppMuted
    );
  }

  @computed get isDarkThemeActive() {
    const activeAdaptableDarkMode = this.stores.settings.all.app.darkMode
      && this.stores.settings.all.app.adaptableDarkMode
      && this.shouldUseDarkColors;
    const forcedDarkMode = this.stores.settings.all.app.darkMode
      && !this.stores.settings.all.app.adaptableDarkMode;
    return activeAdaptableDarkMode || forcedDarkMode;
  }

  @computed get theme() {
    if (this.isDarkThemeActive || this.stores.settings.app.darkMode) return theme('dark');
    return theme('default');
  }

  // Actions
  @action _openSettings({ path = '/settings' }) {
    const settingsPath = path !== '/settings' ? `/settings/${path}` : path;
    this.stores.router.push(settingsPath);
  }

  @action _closeSettings() {
    this.stores.router.push('/');
  }

  @action _toggleServiceUpdatedInfoBar({ visible }) {
    let visibility = visible;
    if (visibility === null) {
      visibility = !this.showServicesUpdatedInfoBar;
    }
    this.showServicesUpdatedInfoBar = visibility;
  }

  // Reactions
  _setupThemeInDOM() {
    const body = document.querySelector('body');

    if (!this.isDarkThemeActive) {
      body.classList.remove('theme__dark');
    } else {
      body.classList.add('theme__dark');
    }
  }
}
