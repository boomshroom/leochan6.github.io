import { character_elements as elements, messageDialog } from "./character_elements.js";
import * as background_api from './background_api.js';
import * as character_list_api from "./character_list_api.js";
import * as database_api from '../../shared/js/database_api.js';
import * as profile_api from './profile_api.js';
import * as utils from '../../shared/js/utils.js';

export let profiles = {};
export let lists = {};
export let settings = {};

let userId = null;

/* ------------------------------ Start Up ------------------------------ */

/**
 * Sets the user id, then loads the message or loads everything else.
 */
export const startUp = (user) => {
  userId = user.uid;
  loadUserName();
  database_api.onceMessageUpdate(userId, (message, blocking) => {
    if (message && blocking) {
      loadMessage(message);
    } else {
      database_api.onSettingUpdate(userId, loadSettings);
      database_api.onProfileUpdate(userId, loadProfiles);
      database_api.onListUpdate(userId, loadLists);
      database_api.onMessageUpdate(userId, loadMessage);
    }
  });
};

/**
 * Loads the user's name.
 */
const loadUserName = () => {
  database_api.onAuthStateChanged(user => {
    let name = user && user.displayName ? user.displayName : "Anonymous";
    elements.header_username.innerHTML = "Welcome " + name;
  });
};

/**
 * Loads the settings.
 * 
 */
const loadSettings = (snapshot) => {
  settings = snapshot.val() ? snapshot.val() : {};
  // init expanded tabs
  if (!settings.expanded_tabs) database_api.initSettings(userId);
  // expand tabs
  Object.entries(settings.expanded_tabs).forEach(([tab_id, expanded]) => {
    let tab = document.querySelector(`#${tab_id}`);
    if (tab) {
      let tab_contents = tab.querySelector(".tab_contents");
      let tab_toggle = tab.querySelector(".tab_toggle");
      if (expanded) {
        if (tab_contents.classList.contains("hidden")) tab_contents.classList.remove("hidden");
        if (tab_toggle.classList.contains("right")) tab_toggle.classList.replace("right", "down");
      } else if (!expanded) {
        if (!tab_contents.classList.contains("hidden")) tab_contents.classList.add("hidden");
        if (tab_toggle.classList.contains("down")) tab_toggle.classList.replace("down", "right");
      }
    }
  });
  if (!settings.background_transparency) settings.background_transparency = 0;
  // display settings
  elements.character_list_content.style.zoom = settings.character_zoom / 100;
  elements.zoom_range.value = settings.character_zoom;
  elements.zoom_field.value = settings.character_zoom;
  elements.displays_per_row.value = settings.displays_per_row;
  document.querySelectorAll(".character_row").forEach(character_row => character_row.style.justifyContent = character_list_api.DIR_TO_FLEX[settings.display_alignment]);
  elements.character_list_content.style.padding = `${settings.padding_y}px ${settings.padding_x}px`;
  elements.display_alignment_select.value = settings.display_alignment;
  elements.display_padding_x_field.value = settings.padding_x;
  elements.display_padding_y_field.value = settings.padding_y;
  elements.background_transparency_range.value = settings.background_transparency;
  elements.background_transparency_field.value = settings.background_transparency;
  utils.setTheme(settings.theme);
};

/**
 * Loads the profiles.
 * 
 */
const loadProfiles = (snapshot) => {
  // get the previous profile.
  let previous = profile_api.getSelectedProfileId();
  // get the settings.
  let val = snapshot.val();
  let filtered = Object.keys(val)
    .filter(key => val[key].type == "character")
    .reduce((obj, key) => {
      return {
        ...obj,
        [key]: val[key]
      };
    }, {});
  // add index property if undefined.
  Object.values(filtered).forEach(profile => {
    if (profile.rules) {
      Object.values(profile.rules).forEach((rule, index) => {
        if (!rule.index) rule.index = index;
      });
    }
  });
  profiles = filtered;
  // update the profile select.
  profile_api.setProfiles(profiles, previous);
};

/**
 * Loads the lists.
 * 
 */
const loadLists = (snapshot) => {
  let val = snapshot.val() ? snapshot.val() : {};
  const filtered = Object.keys(val)
    .filter(key => typeof val[key].characterList !== "undefined")
    .reduce((obj, key) => {
      return {
        ...obj,
        [key]: val[key]
      };
    }, {});
  lists = filtered;
  character_list_api.setLists(lists);
};

/**
 * Loads the message.
 */
const loadMessage = (message) => {
  if (message !== false) {
    messageDialog.open("Message", message);
  }
};

/* ------------------------------ Lists ------------------------------ */

/**
 * Check if list with name name exists.
 */
export const listExists = (name) => {
  if (Object.entries(lists).some((key, list) => list.name === name)) return true;
  return false;
};

/**
 * Create new List of name name.
 */
export const createList = (name) => {
  database_api.createList(userId, { name: name, characterList: false, selectedProfile: "0", selectedBackground: false });
};

/**
 * Rename the List listId with name name.
 */
export const renameList = (listId, name) => {
  database_api.updateListName(userId, listId, name);
};

/**
 * Update the list listId.
 */
export const updateList = (listId, name, characterList, selectedProfile, selectedBackground) => {
  if (characterList.length == 0) characterList = false;
  if (!selectedBackground) selectedBackground = false;
  database_api.updateList(userId, listId, { name: name, characterList: characterList, selectedProfile: selectedProfile, selectedBackground: selectedBackground });
};

/**
 * Updates the profile of list listId with profile profileId.
 */
export const updateListProfile = (listId, profileId) => {
  if (lists[listId].selectedProfile != profileId) database_api.updateListProfile(userId, listId, profileId);
}

/**
 * Deletes the list listId.
 */
export const deleteList = (listId) => {
  database_api.deleteList(userId, listId);
};

/**
 * Duplicates list with name newName.
 */
export const duplicateList = (list, newName) => {
  let selectedProfile = profile_api.getSelectedProfileId() || "0";
  let selectedBackground = background_api.getSelectedBackground() || false;
  database_api.createList(userId, { name: newName, characterList: list.characterList, selectedProfile: selectedProfile, selectedBackground: selectedBackground });
};

/**
 * Create and new list with all the parameters passed in.
 */
export const manualCreateList = (name, characterList, selectedProfile, selectedBackground) => {
  database_api.createList(userId, { name: name, characterList: characterList, selectedProfile: selectedProfile, selectedBackground: selectedBackground });
}

/**
 * Added the character character to the list listId.
 */
export const addCharacterToList = (listId, character) => {
  let newCharacter = {};
  if (character._id) {
    newCharacter[character._id] = character;
    delete character._id;
  } else {
    newCharacter[generatePushID()] = character;
  }
  database_api.updateListItem(userId, listId, "characterList", newCharacter);
}

/**
 * Updates the character characterDisplayId with character character of list listId.
 */
export const updateCharacterOfList = (listId, characterDisplayId, character) => {
  let newCharacter = { [characterDisplayId]: character };
  database_api.updateListItem(userId, listId, "characterList", newCharacter);
}

/**
 * Delete the character characterDisplayId of list listId.
 */
export const deleteCharacterOfList = (listId, characterDisplayId) => {
  database_api.deleteListItem(userId, listId, "characterList", characterDisplayId);
}

/* ------------------------------ Profiles ------------------------------ */

/**
 * Create a new character profile with name name and settings settings.
 */
export const createProfile = (name, rules) => {
  database_api.createProfile(userId, { name: name, type: "character", rules: rules });
};

/**
 * Updates the profile profileId with settings settings.
 */
export const updateProfile = (profileId, rules) => {
  database_api.updateProfile(userId, profileId, { name: profiles[profileId].name, type: "character", rules: rules });
};

/**
 * Deletes profile profileId and updates the profiles of all other lists to default.
 */
export const deleteProfile = (profileId) => {
  database_api.deleteProfile(userId, profileId);
  Object.entries(lists).forEach(([listId, list]) => {
    if (list.selectedProfile === profileId) updateListProfile(listId, "0");
  });
};

/* ------------------------------ Settings ------------------------------ */

/**
 * Updates the setting settingsName with settings newSettings.
 */
export const updateSettings = (settingName, newSettings) => {
  database_api.updateSettings(userId, settingName, newSettings);
};