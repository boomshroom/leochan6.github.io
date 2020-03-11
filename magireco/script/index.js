(function () {
  "use strict";

  window.onload = () => {

    // open the tab.
    document.querySelectorAll(".tablink").forEach(element => {
      element.addEventListener("click", event => {
        utils.openTab(event, element.getAttribute("tab_name"));
      });
    });

    // update the available fields on name change and update preview display.
    name_select.addEventListener("change", () => {
      character_api.updateFieldsOnName();
    });

    // update the preview display on form change.
    document.querySelectorAll(".form").forEach(element => {
      element.addEventListener("change", () => {
        character_api.updatePreviewOnForm();
      });
    });

    // add new character display to list.
    create_button.addEventListener("click", () => {
      character_api.createAddDisplay();
    });

    // updates the character display with the form.
    update_button.addEventListener("click", () => {
      character_api.updateSelectedDisplay();
    });

    // copies the character display to the form.
    copy_button.addEventListener("click", () => {
      character_api.copyDisplay();
    });

    // delete the selected character display from list.
    delete_button.addEventListener("click", () => {
      let character_display = Array.from(document.querySelectorAll(".character_display:not(.preview)")).find(child => child.classList.contains("selected"));
      character_display.remove();
    });

    // update the list on sort form change.
    document.querySelectorAll(".sort_form").forEach(element => {
      element.addEventListener("change", () => {
        character_api.sortOnFormUpdate();
        character_api.changeToCustom();
      });
    });

    // update the list on sort dir click.
    document.querySelectorAll(".sort_dir").forEach(element => {
      element.addEventListener("click", () => {
        if (element.classList.contains("ascend")) {
          element.classList.replace("ascend", "descend");
        }
        else if (element.classList.contains("descend")) {
          element.classList.replace("descend", "ascend");
        }
        character_api.sortOnFormUpdate();
      });
      element.addEventListener("change", () => {
        character_api.changeToCustom();
      });
    });

    // resort when character list changes.
    character_list_content.addEventListener("change", () => {
      character_api.sortOnFormUpdate();
      character_api.updateList();
    });

    // deselect currently selected.
    document.addEventListener("click", (e) => {
      try {
        if (e.target.parentElement.className.indexOf("character_display") === -1 && e.target.parentElement.parentElement.className.indexOf("character_display") === -1) {
          document.querySelectorAll(".character_display:not(.preview)").forEach(child => {
            if (child.classList.contains("selected")) child.classList.remove("selected");
          });
        }
      } catch (error) {
        // type error
      }
    });

    // show the save new profile form.
    new_profile_button.addEventListener("click", () => {
      new_profile_row.style.visibility = "visible"
    });

    // hide the save new profile form.
    close_new_profile_button.addEventListener("click", () => {
      new_profile_row.style.visibility = "collapse"
    });

    // save the new sorting profile.
    save_profile_button.addEventListener("click", () => {
      character_api.saveProfile();
    });

    // check the profile name on change.
    new_profile_field.addEventListener("change", () => {
      character_api.checkProfile();
    });

    // check set the profile properties on change.
    profile_select.addEventListener("change", () => {
      if (profile_select.selectedIndex == storage_api.customIndex) return;
      character_api.setProfile();
      character_api.sortOnFormUpdate();
    });

    // reset the profiles to default.
    reset_profiles_button.addEventListener("click", () => {
      character_api.resetProfiles();
    });

    // show the create new list form.
    new_list_button.addEventListener("click", () => {
      new_list_table.style.visibility = "visible";
    });

    // hide the create new list form.
    new_list_cancel_button.addEventListener("click", () => {
      new_list_table.style.visibility = "collapse";
    });

    // create a new list.
    new_list_create_button.addEventListener("click", () => {
      character_api.createList();
    });

    // check the list name on change.
    new_list_name_field.addEventListener("change", () => {
      character_api.checkListName();
    });
  };

  // initilize name field.
  character_api.getNames((collection) => {
    let prev_id = null;
    let characters = [];
    collection.forEach((character) => {
      if (character.id !== prev_id) {
        characters.push(character);
        prev_id = character.id;
      }
    })
    characters.forEach((character) => {
      name_select.options.add(new Option(character.name, character.id, false));
    });
    name_select.selectedIndex = 0;
    name_select.dispatchEvent(new Event("change"));
  });

  // update form and preview display on startup.
  character_api.startUp();

  // load the settings from the storage.
  storage_api.loadSettings();

  // load the character lists.
  storage_api.loadLists();

}());