import { reaction } from 'mobx';
import themeInfo from '../../assets/themeInfo.json';
import { DEFAULT_APP_SETTINGS, iconSizeBias } from '../../config';

const STYLE_ELEMENT_ID = 'custom-appearance-style';

// Additional styles needed to make accent colors work properly
// "[ACCENT]" will be replaced with the accent color
const ACCENT_ADDITIONAL_STYLES = `
.franz-form__button {
  background: inherit !important;
  border: 2px solid [ACCENT] !important;
}
`;

function createStyleElement() {
  const styles = document.createElement('style');
  styles.id = STYLE_ELEMENT_ID;

  document.querySelector('head').appendChild(styles);
}

function setAppearance(style) {
  const styleElement = document.getElementById(STYLE_ELEMENT_ID);

  styleElement.innerHTML = style;
}

function generateAccentStyle(color) {
  let style = '';

  Object.keys(themeInfo).forEach((property) => {
    style += `
      ${themeInfo[property]} {
        ${property}: ${color};
      }
    `;
  });

  style += ACCENT_ADDITIONAL_STYLES.replace(/\[ACCENT\]/g, color);

  return style;
}

function generateServiceRibbonWidthStyle(widthStr, iconSizeStr, vertical) {
  const width = Number(widthStr);
  const iconSize = Number(iconSizeStr) - iconSizeBias;

  return vertical ? `
    .tab-item {
      width: ${width - 2}px !important;
      height: ${width - 5 + iconSize}px !important;
    }
    .tab-item .tab-item__icon {
      width: ${(width / 2) + iconSize}px !important;
    }
    .sidebar__button {
      font-size: ${width / 3}px !important;
    }
  ` : `
    .sidebar {
      width: ${width - 1}px !important;
    }
    .tab-item {
      width: ${width - 2}px !important;
      height: ${width - 5 + iconSize}px !important;
    }
    .tab-item .tab-item__icon {
      width: ${(width / 2) + iconSize}px !important;
    }
    .sidebar__button {
      font-size: ${width / 3}px !important;
    }
  `;
}

function generateShowDragAreaStyle(accentColor) {
  return `
    .sidebar {
      padding-top: 0px !important;
    }
    .window-draggable {
      position: initial;
      background-color: ${accentColor};
    }
    #root {
      /** Remove 22px from app height, otherwise the page will be to high */
      height: calc(100% - 22px);
    }
  `;
}

function generateVerticalStyle(widthStr) {
  if (!document.getElementById('vertical-style')) {
    const link = document.createElement('link');
    link.id = 'vertical-style';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = './styles/vertical.css';

    document.head.appendChild(link);
  }
  const width = Number(widthStr);

  return `
  .app_service {
    top: ${width}px !important;
  }
  .darwin .sidebar {
    height: ${width + 19}px !important;
  }
  .darwin .sidebar .sidebar__button--workspaces.is-active {
      height: ${width - 20}px !important;
  }
  `;
}

function generateStyle(settings) {
  let style = '';

  const {
    accentColor,
    serviceRibbonWidth,
    iconSize,
    showDragArea,
    useVerticalStyle,
  } = settings;

  if (accentColor !== DEFAULT_APP_SETTINGS.accentColor) {
    style += generateAccentStyle(accentColor);
  }
  if (serviceRibbonWidth !== DEFAULT_APP_SETTINGS.serviceRibbonWidth
      || iconSize !== DEFAULT_APP_SETTINGS.iconSize) {
    style += generateServiceRibbonWidthStyle(serviceRibbonWidth, iconSize, useVerticalStyle);
  }
  if (showDragArea) {
    style += generateShowDragAreaStyle(accentColor);
  }
  if (useVerticalStyle) {
    style += generateVerticalStyle(serviceRibbonWidth);
  } else if (document.getElementById('vertical-style')) {
    const link = document.getElementById('vertical-style');
    document.head.removeChild(link);
  }

  return style;
}
function updateStyle(settings) {
  const style = generateStyle(settings);
  setAppearance(style);
}

export default function initAppearance(stores) {
  const { settings } = stores;
  createStyleElement();

  // Update accent color
  reaction(
    () => (
      settings.all.app.accentColor
    ),
    () => {
      updateStyle(settings.all.app);
    },
    {
      fireImmediately: true,
    },
  );
  // Update service ribbon width
  reaction(
    () => (
      settings.all.app.serviceRibbonWidth
    ),
    () => {
      updateStyle(settings.all.app);
    },
  );
  // Update icon size
  reaction(
    () => (
      settings.all.app.iconSize
    ),
    () => {
      updateStyle(settings.all.app);
    },
  );
  // Update draggable area
  reaction(
    () => (
      settings.all.app.showDragArea
    ),
    () => {
      updateStyle(settings.all.app);
    },
  );
  // Update vertical style
  reaction(
    () => (
      settings.all.app.useVerticalStyle
    ),
    () => {
      updateStyle(settings.all.app);
    },
  );
}
