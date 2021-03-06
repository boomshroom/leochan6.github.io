import { character_collection } from '../../collection/character_collection.js';
import { character_elements as elements, characterSelectDialog, messageDialog } from './character_elements.js';
import * as character_list_api from './character_list_api.js';
import * as storage_api from './storage_api.js';

export let selectedCharacter = null;

export class Display {
  constructor(id, name, rank, post_awaken, attribute, level, magic, magia, episode, doppel) {
    if (typeof rank !== undefined) {
      this.character_id = id;
      this.name = name;
      this.rank = rank;
      this.post_awaken = post_awaken;
      this.attribute = attribute;
      this.level = level;
      this.magic = magic;
      this.magia = magia;
      this.episode = episode;
      this.doppel = doppel;
    } else {
      this._id = id;
      this.character_id = name.character_id;
      this.name = name.name;
      this.rank = name.rank;
      this.post_awaken = name.post_awaken;
      this.attribute = name.attribute;
      this.level = name.level;
      this.magic = name.magic;
      this.magia = name.magia;
      this.episode = name.episode;
      this.doppel = name.doppel;
    }
  }
};

export class Character {
  constructor(id, name, attribute, ranks) {
    this.id = id;
    this.name = name;
    this.attribute = attribute;
    this.ranks = ranks;
  }
};

/**
 * get the attribute and rank for the character.
 * 
 * @param {String} id 
 * @param {Function} callback 
 */
const getCharacter = (id) => {
  try {
    let character = character_collection.find(character => character.id === id);
    let name = character.name;
    let attribute = character.attribute.toLowerCase();
    let ranks = character.ranks;
    return new Character(id, name, attribute, ranks);
  } catch (e) {
    return null;
  }
};

/**
 * gets the basic display for the character.
 * 
 * @param {Character} character 
 */
const getBasicCharacterDisplay = (character) => {
  return new Display(character.id, character.name, getMinRank(character.ranks), false, character.attribute, "1", "0", "1", "1", "locked");
};

/**
 * check if display is valid.
 * 
 * @param {String} character_id 
 * @param {Display} display 
 * @param {boolean} validName 
 */
export const isValidCharacterDisplay = (character_id, display, validName = true) => {
  let character = getCharacter(character_id);
  if (!character) return ["Cannot get character."]
  let err = [];
  // check id.
  if (display.character_id !== character.id) err.push(`Display Id ${display.character_id} does not match Character ID ${character.id}.`);
  // check name.
  if (display.name !== character.name && validName) err.push(`Display Name ${display.name} does not match Character Name ${character.name}.`);
  // check rank.
  if (!character.ranks[display.rank]) err.push(`Display Rank ${display.rank} does not match Character Ranks ${JSON.stringify(character.ranks)}`);
  // check level.
  let maxLevel = parseInt(getMaxLevel(display.rank));
  if (parseInt(display.level) < 1 || parseInt(display.level) > maxLevel || !display.level) err.push(`Display Level ${display.level} for Display Rank ${display.rank} must be between 1 and ${maxLevel}.`);
  // check magic.
  if (display.magic < 0 || display.magic > 3) err.push(`Display Magic ${display.magic} must be between 0 and 3.`);
  // check magia.
  if (display.magia < 1 || display.magia > 5) err.push(`Display Magia ${display.magia} must be between 1 and 5.`);
  if (display.magia > display.episode) err.push(`Display Magia ${display.magia} must be less than or equal to Display Episode ${display.episode}.`);
  // check episode.
  if (display.episode < 1 || display.episode > 5) err.push(`Display Episode ${display.episode} must be between 1 and 5.`);
  if (!(display.doppel === "locked" || display.doppel === "unlocked") || (display.doppel === "unlocked" && display.magia < 5)) err.push(`Display Doppel ${display.doppel} can only be unlocked if Magia 5.`);
  return err;
};

/**
 * get Display from the form.
 * 
 * @return {Display}
 */
const getFormDisplay = () => {
  let display = new Display(
    elements.name_select.value,
    elements.name_select[name_select.options.selectedIndex].text,
    elements.rank_select.value,
    elements.post_awaken_checkbox.checked,
    character_collection.find(char => char.id === elements.name_select.value).attribute.toLowerCase() || null,
    elements.level_select.value,
    elements.magic_select.value,
    elements.magia_select.value,
    elements.episode_select.value,
    elements.doppel_select.value);
  return display;
};

/**
 * get Display from character display.
 * 
 * @param {HTMLDivElement} character_display
 * @return {Display}
 */
export const getCharacterDisplay = (character_display) => {
  let display = new Display(
    character_display.getAttribute("character_id"),
    character_display.getAttribute("name"),
    character_display.getAttribute("rank"),
    character_display.getAttribute("post_awaken"),
    character_display.getAttribute("attribute"),
    character_display.getAttribute("level"),
    character_display.getAttribute("magic"),
    character_display.getAttribute("magia"),
    character_display.getAttribute("episode"),
    character_display.getAttribute("doppel"));
  display._id = character_display.getAttribute("_id");
  return display;
};

/**
 * create a character display element from Display.
 * 
 * @param {Display} display
 * @return {HTMLDivElement}
 */
export const createDisplay = (display, listener = false) => {
  let character_display = document.createElement("div");
  character_display.classList.add("character_display");
  character_display.setAttribute("_id", display._id);
  character_display.setAttribute("character_id", display.character_id || display.id);
  character_display.setAttribute("name", display.name);
  character_display.setAttribute("rank", display.rank);
  character_display.setAttribute("post_awaken", display.post_awaken);
  character_display.setAttribute("attribute", display.attribute);
  character_display.setAttribute("magic", display.magic);
  character_display.setAttribute("magia", display.magia);
  character_display.setAttribute("episode", display.episode);
  character_display.setAttribute("level", display.level);
  character_display.setAttribute("doppel", display.doppel);
  character_display.innerHTML = `
  <img class="background" src="/magireco/assets/ui/bg/${display.attribute}.png">
  <img class="card_image" src="/magireco/assets/image/card_${display.character_id}${display.rank}_f.png">
  <img class="frame_rank" src="/magireco/assets/ui/frame/${display.rank}.png">
  <img class="star_rank" src="/magireco/assets/ui/star/${display.rank}.png">
  <img class="attribute" src="/magireco/assets/ui/attribute/${display.attribute}.png">
  <img class="magic" src="/magireco/assets/ui/magic/${display.magic}.png">
  <img class="magia" src="/magireco/assets/ui/magia/${display.magia}-${display.episode}.png">
  <div class="level">
    <div class="level_pre">Lvl.</div>
    <div class="level_num">${display.level}</div>
  </div>
  <img class="doppel" src="/magireco/assets/ui/doppel/${display.doppel}.png">
  <img class="post_awaken" src="/magireco/assets/ui/gift/gift_${display.post_awaken}.png">`;

  if (listener) {
    character_display.addEventListener("click", () => {
      selectDisplay(character_display);
    });
  }
  character_display.addEventListener("contextmenu", e => {
    e.preventDefault();
    openCharacterDialog(character_collection.find(elem => elem.id === display.character_id));
  });
  return character_display;
};

export const getMaxLevel = (rank) => {
  if (rank == "1") return "40";
  else if (rank == "2") return "50";
  else if (rank == "3") return "60";
  else if (rank == "4") return "80";
  else if (rank == "5") return "100";
};

const RANK_TO_LEVEL = { "1": "40", "2": "50", "3": "60", "4": "80", "5": "100" };

export const getMinRank = (ranks) => {
  let minRank = "5";
  Object.entries(ranks).reverse().forEach(([rank, value]) => minRank = value ? rank : minRank);
  return minRank;
};

export const getMaxRank = (ranks) => {
  let maxRank = "1";
  Object.entries(ranks).forEach(([rank, value]) => maxRank = value ? rank : maxRank);
  return maxRank;
};

export const minimizeDisplay = () => {
  let character_display = getCharacterDisplay(display_preview.children[0]);
  let character = character_collection.find(char => char.id === character_display.character_id);
  let minRank = getMinRank(character.ranks);
  let attribute = character.attribute.toLowerCase();
  let display = new Display(character.id, character.name, minRank, false, attribute, "1", "0", "1", "1", "locked");
  updateForm(display);
  updatePreviewDisplay(display);
};

export const maximizeDisplay = () => {
  let character_display = getCharacterDisplay(display_preview.children[0]);
  let character = character_collection.find(char => char.id === character_display.character_id);
  let maxRank = getMaxRank(character.ranks);
  let level = RANK_TO_LEVEL[maxRank];
  let attribute = character.attribute.toLowerCase();
  let display = new Display(character.id, character.name, maxRank, true, attribute, level, "3", "5", "5", maxRank == "5" ? "unlocked" : "locked");
  updateForm(display);
  updatePreviewDisplay(display);
};

/**
 * updates the display preview with Display.
 * 
 * @param {HTMLDivElement} display
 */
const updatePreviewDisplay = (display) => {
  let character_display = createDisplay(display);
  character_display.classList.add("preview");
  elements.display_preview.innerHTML = "";
  elements.display_preview.appendChild(character_display);
};

/**
 * updates the form with Display.
 * 
 * @param {Display} display
 */
const updateForm = (display) => {
  elements.name_select.value = display.character_id;
  elements.rank_select.value = display.rank;
  elements.post_awaken_checkbox.checked = display.post_awaken === "true" || display.post_awaken === true ? true : false;
  elements.level_select.value = display.level;
  elements.magic_select.value = display.magic;
  elements.magia_select.value = display.magia;
  elements.episode_select.value = display.episode;
  elements.doppel_select.value = display.doppel;
};

/**
 * updates the form with the available options and selects lowest.
 * 
 * @param {Character} character
 */
const updateFormEnabled = (character) => {
  // enable or disable the rank select.
  for (let i = 0; i < 5; i++) {
    elements.rank_select.options[i].disabled = !character.ranks[i + 1];
  }
  // if the currently select rank is disabled, then select minimum available rank.
  if (!character.ranks[rank_select.selectedIndex + 1]) {
    elements.rank_select.selectedIndex = getMinRank(character.ranks) - 1;
    // update the level to match max rank.
    elements.level_select.value = RANK_TO_LEVEL[elements.rank_select.value]
  }
  // enable or disable the doppel select.
  if (getMaxRank(character.ranks) == "5") {
    elements.doppel_select.options[0].disabled = false;
    elements.doppel_select.options[1].disabled = false;
    elements.doppel_select.value = "locked";
  } else {
    elements.doppel_select.options[0].disabled = false;
    elements.doppel_select.options[1].disabled = true;
  }
};

/**
 * gets the standard display given the display.
 * 
 * @param {Character} character 
 * @param {Display} display 
 */
const updateCharacterWithDisplay = (character, display) => {
  // return the default display.
  if (!display) return getBasicCharacterDisplay(character);
  return new Display(character.id, character.name, display.rank, display.post_awaken, character.attribute, display.level, display.magic, display.magia, display.episode, display.doppel);
};

/**
 * starts up the list.
 */
export const startUp = () => {
  // initialize name field.
  [...character_collection].sort((a, b) => a.name > b.name ? 1 : -1).forEach((character) => {
    elements.name_select.options.add(new Option(character.name, character.id, false));
  });
  // name_select.selectedIndex = 0;
  elements.name_select.value = 1001;
  elements.name_select.dispatchEvent(new Event("change"));

  let character = getCharacter("1001");
  updateFormEnabled(character);
  updatePreviewDisplay(getBasicCharacterDisplay(character));
};

/**
 * updates the form fields with the selected character.
 */
export const updateFieldsOnName = () => {
  let character = getCharacter(name_select.value);
  updateFormEnabled(character);
  let character_preview = updateCharacterWithDisplay(character, getFormDisplay());
  updateForm(character_preview);
  updatePreviewDisplay(character_preview);
};

/**
 * updates the form fields with the selected character's rank.
 */
export const updateFieldsOnRank = () => {
  let character = getCharacter(name_select.value);
  let form_display = getFormDisplay();
  let maxLevel = RANK_TO_LEVEL[form_display.rank];
  if (parseInt(form_display.level) > parseInt(maxLevel)) form_display.level = maxLevel;
  let character_preview = updateCharacterWithDisplay(character, form_display);
  updateForm(character_preview);
  updatePreviewDisplay(character_preview);
};

/**
 * updates the form fields with the selected character's magia.
 */
export const updateFieldsOnMagia = () => {
  let character = getCharacter(name_select.value);
  let form_display = getFormDisplay();
  if (form_display.magia > form_display.episode) form_display.episode = form_display.magia;
  let character_preview = updateCharacterWithDisplay(character, form_display);
  updateForm(character_preview);
  updatePreviewDisplay(character_preview);
};

/**
 * adds a new character display to the list.
 */
export const createCharacter = () => {
  let display = getFormDisplay();
  let listId = character_list_api.getListId();
  display._id = generatePushID();
  selectedCharacter = { characterDisplayId: display._id, character_display: display };
  storage_api.addCharacterToList(listId, display);
};

/**
 * updates the selected character display with the contents of the form.
 */
export const updateCharacter = () => {
  let character_display = Array.from(document.querySelectorAll(".character_display:not(.preview)")).find(child => child.classList.contains("selected"));
  if (!character_display) return;
  let display = getFormDisplay();
  selectedCharacter = { characterDisplayId: character_display.getAttribute("_id"), character_display: display };
  storage_api.updateCharacterOfList(character_list_api.getListId(), character_display.getAttribute("_id"), display);
};

/**
 * copies the contents of the selected display to the form.
 */
export const copyCharacter = () => {
  let character_display = Array.from(document.querySelectorAll(".character_display:not(.preview)")).find(child => child.classList.contains("selected"));
  if (!character_display) return;
  let display = getCharacterDisplay(character_display);
  getCharacter(character_display.getAttribute("character_id"), character => updateFormEnabled(character));
  updateFormEnabled(getCharacter(display.character_id));
  updateForm(display);
  updatePreviewDisplay(display);
  // }
};

/**
 * deletes the selected character display and finds the next display to be selected.
 */
export const deleteCharacter = () => {
  let character_display = Array.from(document.querySelectorAll(".character_display:not(.preview)")).find(child => child.classList.contains("selected"));
  if (!character_display) return;
  let display = getCharacterDisplay(character_display);
  if (character_display.nextElementSibling) {
    selectedCharacter = { characterDisplayId: character_display.nextElementSibling.getAttribute("_id") };
  } else if (character_display.previousElementSibling) {
    selectedCharacter = { characterDisplayId: character_display.previousElementSibling.getAttribute("_id") };
  } else {
    selectedCharacter = null;
  }
  storage_api.deleteCharacterOfList(character_list_api.getListId(), display._id);
};

/**
 * selects the display element.
 */
export const selectDisplay = (character_display) => {
  // return of already selected.
  if (character_display.classList.contains("selected")) return;
  // deselect all other character displays
  document.querySelectorAll(".character_display:not(.preview)").forEach(child => {
    if (child.classList.contains("selected")) child.classList.remove("selected");
  });
  character_display.classList.add("selected");
  selectedCharacter = { character_display_element: character_display };
  enableButtons();
  // update the form.
  copyCharacter();
};

/**
 * finds and select the display element.
 */
export const findAndSelectDisplay = () => {
  if (selectedCharacter) {
    if (selectedCharacter.characterDisplayId) {
      let character_display = document.querySelector(`.character_display[_id="${selectedCharacter.characterDisplayId}"]`);
      if (character_display) selectDisplay(character_display);
    } else if (selectedCharacter.character_display_element) {
      selectDisplay(selectedCharacter.character_display_element);
    }
  }
};

/**
 * updates the preview character display with the contents of the form.
 */
export const updatePreviewOnForm = () => {
  let display = getFormDisplay();
  character_error_text.innerHTML = '';
  let error = isValidCharacterDisplay(name_select.value, display);
  if (error.length == 0) {
    enableButtons();
    updatePreviewDisplay(display);
    updateCharacter();
  } else {
    create_button.disabled = true;
    update_button.disabled = true;
    character_error_text.innerHTML = error.toString();
  }
};

/**
 * deselects the select character display.
 */
export const deselectDisplay = () => {
  if (selectedCharacter && selectedCharacter.character_display_element) {
    selectedCharacter.character_display_element.classList.remove("selected");
    selectedCharacter = null;
    enableButtons();
  }
}

/**
 * Enable and Disable the Character Buttons based on the current state.
 */
export const enableButtons = () => {
  if (character_list_api.selectedList && character_list_api.selectedList.listId) {
    if (elements.create_button.disabled) elements.create_button.disabled = false;
    if (elements.min_all_button.disabled) elements.min_all_button.disabled = false;
    if (elements.max_all_button.disabled) elements.max_all_button.disabled = false;
    if (elements.selectedCharacter && selectedCharacter.elements.character_display_element) {
      if (elements.update_button.disabled) elements.update_button.disabled = false;
      if (elements.copy_button.disabled) elements.copy_button.disabled = false;
      if (elements.delete_button.disabled) elements.delete_button.disabled = false;
    } else {
      if (!elements.update_button.disabled) elements.update_button.disabled = true;
      if (!elements.copy_button.disabled) elements.copy_button.disabled = true;
      if (!elements.delete_button.disabled) elements.delete_button.disabled = true;
    }
  } else {
    if (!elements.create_button.disabled) elements.create_button.disabled = true;
    if (!elements.update_button.disabled) elements.update_button.disabled = true;
    if (!elements.copy_button.disabled) elements.copy_button.disabled = true;
    if (!elements.delete_button.disabled) elements.delete_button.disabled = true;
    if (!elements.min_all_button.disabled) elements.min_all_button.disabled = true;
    if (!elements.max_all_button.disabled) elements.max_all_button.disabled = true;
  }
};

/**
 * opens the modal dialog for character selection user interface.
 */
export const loadCharacterSelectList = () => {
  characterSelectDialog.list.innerHTML = "";
  character_collection.forEach(character => {
    let star = 1;
    for (let [key, value] of Object.entries(character.ranks)) {
      if (value) {
        star = key;
        break;
      }
    }
    let added = Object.values(storage_api.lists[character_list_api.getListId()].characterList).find(char => char.character_id === character.id);
    let container = document.createElement("div");
    container.classList.add("character_image_preview");
    container.setAttribute("character_id", character.id);
    let image = document.createElement("img");
    image.src = `/magireco/assets/image/card_${character.id}${star}_f.png`;
    image.title = character.name;
    container.append(image);
    if (added) {
      let text = document.createElement("label");
      text.classList.add("character_label");
      text.innerHTML = "✓";
      container.append(text);
    }
    container.addEventListener("click", () => {
      name_select.value = character.id;
      name_select.dispatchEvent(new Event("change"));
      characterSelectModal.style.display = "none";
      characterSelectModalSearch.value = "";
    });
    container.addEventListener("contextmenu", e => {
      e.preventDefault();
      openCharacterDialog(character);
    });
    characterSelectDialog.list.append(container);
  });
  toggleAdded(characterSelectDialog.added.checked);
};

/**
 * Filters the character_image_preview's based on the search.
 * 
 * @param {String} search
 */
export const filterCharacters = (search) => {
  if (!search || search.length == 0) {
    Array.from(characterSelectDialog.list.children).forEach(child => {
      if (child.classList.contains("hidden")) {
        child.classList.remove("hidden");
        child.style.display = "inline-block";
      }
    });
  }
  search = search.toLowerCase();
  Array.from(characterSelectDialog.list.children).forEach(child => {
    let character = character_collection.find(char => child.getAttribute("character_id") === char.id);
    if (character.id.includes(search)
      || character.name.toLowerCase().includes(search)
      || character.attribute.toLowerCase().includes(search)
      || Object.entries(character.ranks).some(([rank, value]) => value && rank.includes(search))
    ) {
      child.classList.remove("hidden");
      child.style.display = "inline-block";
    } else {
      child.classList.add("hidden");
      child.style.display = "none";
    }
  });
  toggleAdded(characterSelectDialog.added.checked);
};

export const toggleAdded = (value) => {
  if (value) {
    Array.from(characterSelectDialog.list.children).forEach(child => {
      if (child.querySelector(".character_label")) child.classList.add("hidden");
    });
  } else {
    Array.from(characterSelectDialog.list.children).forEach(child => {
      if (child.classList.contains("hidden")) child.classList.remove("hidden");
    });
  }
};

export const openCharacterDialog = (character) => {
  messageDialog.open(`${character.name} Details`, `Attribute: ${character.attribute}\
  \nRanks: ${Object.keys(character.ranks).filter(key => character.ranks[key])}\
  \nObtainability: ${character.obtainability}\
  \nFandom Wiki Link:\n${character.url}`);
};