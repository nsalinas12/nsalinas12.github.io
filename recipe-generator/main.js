window.addEventListener("DOMContentLoaded", (event) => {
    addRecipeAPIEventListeners();
    parseRecipeResults(dinner_postman_response, "http://www.cookincanuck.com/2013/09/stuffed-sweet-potato-recipe-with-spinach-hummus-feta/");
});

let API_KEY = '688a61ea646c44f7b50b9945a41dec2e';
let INGREDIENT_BASE_URL = "https://spoonacular.com/cdn/ingredients_100x100/"
let EQUIPMENT_BASE_URL = "https://spoonacular.com/cdn/equipment_100x100/"

let INGREDIENTS_SORTED_ALPHABETICALLY = [];
let INGREDIENTS_SORTED_CATEGORY = [];
let INGREDIENTS_SORTED_PURCHASED = [];
let INGREDIENTS_SORTED_UNPURCHASED = [];

let STORED_INSTRUCTIONS_ALL = null;
let STORED_INSTRUCTIONS_ONLY_EQUIPMENT = null;
let STORED_INSTRUCTIONS_ONLY_INGREDIENTS = null;
let STORED_INSTRUCTIONS_NONE = null;

function buildSearchingElement() {

    let bodyElement = document.querySelector("body");
    bodyElement.setAttribute("class", "no-scroll");

    let SEARCHING_ELEMENT = document.createElement("div");
    SEARCHING_ELEMENT.setAttribute("id", "status-container");
    SEARCHING_ELEMENT.setAttribute("class", "isSearching");
    let secondChild = document.createElement("div");
    secondChild.setAttribute("class", "spinning-wrapper");
    let thirdChild = document.createElement("div");
    thirdChild.setAttribute("class", "spinning-indicator");
    secondChild.append(thirdChild);
    SEARCHING_ELEMENT.append(secondChild);

    bodyElement.append(SEARCHING_ELEMENT);
    
    return SEARCHING_ELEMENT;
}

function removeSearchingElement() {
    let SEARCHING_ELEMENT = document.getElementById("status-container");
    if (SEARCHING_ELEMENT != null) {
        let bodyElement = document.querySelector("body");
        bodyElement.removeChild(SEARCHING_ELEMENT);
        bodyElement.removeAttribute("class");
    }
    window.scrollTo(0, 0); 
}

function addRecipeAPIEventListeners() {
    let searchButton = document.querySelector(".searchbar-button-item");
    searchButton.addEventListener("click", (event) => {
        event.preventDefault();
        buildSearchingElement();
        let searchQueryRaw = event.target.form[0].value;
        let url = "https://api.spoonacular.com/recipes/search?apiKey=" + API_KEY.toString() + "&number=1&query=" + searchQueryRaw.replace(" ", "%20").toString();
        fetch(url).then(async (response) => {
            let jsonResponse = await response.json();
            if (jsonResponse["code"] == 402) {
                handleNotice("You exceeded daily recipe search limit.");
            } else if (jsonResponse["results"].length == 0) {
                handleNotice("No results found for '" + searchQueryRaw + "'.", false);
            } else {
                handleRecipeExtraction(jsonResponse["results"][0]["sourceUrl"]);
            }
        }).catch((err) => {
            console.log("ERROR:\t", err);
            handleNotice(err);
        });
    });
}

function addGeneralEventListeners() {
    addButtonEventListeners();
    addSelectEventListeners();
    addInstructionsEventListeners();
}

function addButtonEventListeners() {
    let ingredientButtons = Array.from(document.querySelectorAll(".ingredient-button"));
    ingredientButtons.map((button) => {
        button.addEventListener("click", (event) => {
            let articleElement = event.path[3];
            let imageElement = articleElement.querySelector(".ingredient-image");
            imageElement.classList.add("opaque");
            let selectedButtonName = "ingredient-button-selected";
            let selectedItemName = "ingredient-item-selected";
            if (event.target.classList.contains(selectedButtonName)) {
                event.target.classList.remove(selectedButtonName);
                articleElement.classList.remove(selectedItemName);
                imageElement.classList.remove("opaque");
            } else {
                event.target.classList.add(selectedButtonName);
                articleElement.classList.add(selectedItemName);
                imageElement.classList.add("opaque")
            }
        });
    });
}

function addSelectEventListeners() {
    let sorterFunction = function (a, b) {
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        } else {
            return 0;
        }
    }
    // Select Sorter
    document.getElementById("ingredientSortOptions").addEventListener("change", (event) => {
        let sortOption = event.target.value;
        let ingredientsList = Array.from(document.getElementById("ingredients").querySelectorAll("article"));

        // Sort by ingredient title
        if (sortOption == "category" && INGREDIENTS_SORTED_CATEGORY.length == 0) {
            ingredientsList.sort((a, b) => sorterFunction(a.dataset.aisle, b.dataset.aisle));
            INGREDIENTS_SORTED_CATEGORY = ingredientsList;
        } else if (sortOption == "category" && INGREDIENTS_SORTED_CATEGORY.length != 0) {
            ingredientsList = INGREDIENTS_SORTED_CATEGORY;
        }

        // Sort alphabetically title
        if (sortOption == "alphabetically" && INGREDIENTS_SORTED_ALPHABETICALLY.length == 0) {
            ingredientsList.sort((a, b) => sorterFunction(a.dataset.name, b.dataset.name));
            INGREDIENTS_SORTED_ALPHABETICALLY = ingredientsList;
        } else if (sortOption == "alphabetically" && INGREDIENTS_SORTED_ALPHABETICALLY.length != 0) {
            ingredientsList = INGREDIENTS_SORTED_ALPHABETICALLY;
        }

        // Sort by purchased
        if (sortOption == "purchased" || sortOption == "unpurchased") {
            let purchasedDivs = Array.from(document.querySelectorAll(".ingredient-item-selected"));
            let unpurchasedDivs = ingredientsList.concat().filter((item) => purchasedDivs.indexOf(item) == -1);
            ingredientsList = sortOption == "purchased" ?
                purchasedDivs.concat(unpurchasedDivs) :
                unpurchasedDivs.concat(purchasedDivs);
        }

        // Replace children
        let ingredientsContainer = document.getElementById("ingredients");
        ingredientsContainer.querySelectorAll("article").forEach((child) => {
            ingredientsContainer.removeChild(child)
        });
        ingredientsList.map((child) => {
            ingredientsContainer.appendChild(child)
        })
    });
}

function addInstructionsEventListeners() {
    Array.from(document.querySelectorAll(".instructions-top-row-button-item")).map((button) => button.addEventListener("click", () => buttonFunction()));

    let storeChildren = function (dataID) {
        Array.from(document.querySelectorAll(dataID)).map((item) => {
            item.style.display = "none";
        });
        return document.getElementById("instructions").cloneNode(true);
    }

    let replaceChildren = function (STORED_LIST) {
        let parent = document.getElementById("instructions");
        parent.querySelectorAll("article").forEach((child) => {
            parent.removeChild(child);
        });
        STORED_LIST.cloneNode(true).querySelectorAll("article").forEach((child) => {
            parent.appendChild(child);
        });
        return parent;
    }

    let buttonFunction = function () {
        let showIngredients = document.querySelectorAll(".instructions-top-row-button-item")[0].checked;
        let showEquipment = document.querySelectorAll(".instructions-top-row-button-item")[1].checked;

        //Case 1: No ingredients or equipment stored
        if (STORED_INSTRUCTIONS_ALL == null) { STORED_INSTRUCTIONS_ALL = document.getElementById("instructions").cloneNode(true); }
        //Case 2: Both ingredients and equipment checked and already stored
        if (showIngredients && showEquipment && STORED_INSTRUCTIONS_ALL != null) { replaceChildren(STORED_INSTRUCTIONS_ALL); }
        //Case 3: Only equipment checked
        else if (!showIngredients && showEquipment) {
            //Case 3a: Equipment not stored
            if (STORED_INSTRUCTIONS_ONLY_EQUIPMENT == null) {
                if (STORED_INSTRUCTIONS_NONE != null) { replaceChildren(STORED_INSTRUCTIONS_ALL.cloneNode(true)); }
                STORED_INSTRUCTIONS_ONLY_EQUIPMENT = storeChildren("[data-id='Ingredients']");
            }
            //Case 3b: Equipment already stored
            else { replaceChildren(STORED_INSTRUCTIONS_ONLY_EQUIPMENT); }
        }
        //Case 4: Only ingredients checked
        else if (showIngredients && !showEquipment) {
            //Case 4a: Ingredients not stored
            if (STORED_INSTRUCTIONS_ONLY_INGREDIENTS == null) {
                if (STORED_INSTRUCTIONS_NONE != null) { replaceChildren(STORED_INSTRUCTIONS_ALL.cloneNode(true)); }
                STORED_INSTRUCTIONS_ONLY_INGREDIENTS = storeChildren("[data-id='Equipment']");
            }
            //Case 4b: Ingredients already stored
            else { replaceChildren(STORED_INSTRUCTIONS_ONLY_INGREDIENTS);}
        }
        //Case 5: Neither ingredients nor equipment checked
        else {
            //Case 5a: No extra data is not stored
            if (STORED_INSTRUCTIONS_NONE == null) { STORED_INSTRUCTIONS_NONE = storeChildren(".instruction-images") }
            //Case 5b: No extra data is stored
            else { replaceChildren(STORED_INSTRUCTIONS_NONE); }
        }
    }
}

function handleRecipeExtraction(sourceURL) {
    let url = "https://api.spoonacular.com/recipes/extract?url=" + sourceURL.toString() + "&apiKey=" + API_KEY.toString();
    fetch(url).then(async (response) => {
        let results = await response.json();
        parseRecipeResults(results, sourceURL);
    }).catch((err) => {
        console.log("ERROR:\t", err);
    });
}

function parseRecipeResults(jsonResponse, sourceURL=null) {

    //1. Recipe Title
    let recipeTitle = jsonResponse["title"];
    let recipeTitleContainer = document.querySelector(".recipe-name-title");
    recipeTitleContainer.textContent = recipeTitle;

    //2. Recipe Details Items
    let recipeDetailsContainer = document.querySelector(".recipe-name-details");
    recipeDetailsContainer.innerHTML = "";
    
    //2a. Source URL Item
    if (sourceURL != null) {
        let sourceURLElement = document.createElement("a");
        sourceURLElement.setAttribute("href", sourceURL);
        sourceURLElement.addEventListener("click", () => {
            event.preventDefault();
            window.open(sourceURL);
        });
        sourceURLElement.textContent = "Original Recipe";
        sourceURLElement.classList.add("recipe-name-item");
        recipeDetailsContainer.appendChild(sourceURLElement);
    }

    function createTagItem(stringText) {
        let newElement = document.createElement("i");
        newElement.textContent = stringText;
        newElement.classList.add("recipe-name-item");
        recipeDetailsContainer.appendChild(newElement);
    }
    //2b. Timing Item
    if (jsonResponse["readyInMinutes"] != null) {
        createTagItem("Ready in " + jsonResponse["readyInMinutes"].toString() + " minutes");
    }
    //2c. Servings Item
    if (jsonResponse["servings"] != null) {
        createTagItem("Makes " + jsonResponse["servings"] + ( jsonResponse["servings"] > 1 ? " servings" : " serving" ));
    }
    //2d. Cuisines Item
    if (jsonResponse["cuisines"].length != 0) {
        jsonResponse["cuisines"].map((item) => createTagItem(item));
    }
    
    //3. Recipe Summary
    document.querySelector(".recipe-name-summary").innerHTML = "";
    if (jsonResponse["summary"] != null) {
        let parser = new DOMParser();
        let recipeSummary = parser.parseFromString(jsonResponse["summary"], 'text/html').querySelector("body");
        document.querySelector(".recipe-name-summary").innerHTML = recipeSummary.innerHTML;
    }
    
    //4. Recipe Image
    let imageURL = jsonResponse["image"];
    let imageElement = document.querySelector(".recipe-image-content");
    imageElement.setAttribute("src", imageURL);

    //5. Ingredients
    let ingredientsList = jsonResponse["extendedIngredients"];
    loadIngredients(ingredientsList);

    //6. Instructions
    let instructionArray = jsonResponse["analyzedInstructions"];
    if (instructionArray.length != 0) {
        loadDirections(instructionArray[0]["steps"]);
    }

    handleNotice("", true);
    document.querySelector("main").classList.remove("isHidden");
    removeSearchingElement();
}

function loadIngredients(ingredientsList) {
    let ingredientContainer = document.getElementById("ingredients");
    ingredientContainer.querySelectorAll("article").forEach((child) => {
        ingredientContainer.removeChild(child)
    });
    ingredientsList.map((item) => {
        //1. Clone Template
        let newIngredientItem = document.querySelector("#templateIngredientItem").content.cloneNode(true);

        //2. Set Data Attributes
        let newIngredientParent = newIngredientItem.querySelector("article");
        newIngredientParent.setAttribute("data-aisle", item["aisle"].split(";").join(","));
        newIngredientParent.setAttribute("data-name", item["name"]);

        //3. Load Aisle Tag
        let ingredientTag = newIngredientItem.querySelector(".ingredient-tag");
        ingredientTag.textContent = item["aisle"].split(";").join(", ");

        //4. Load Image
        let imageURL = INGREDIENT_BASE_URL + item["image"].toString();
        newIngredientItem.querySelector(".ingredient-image").setAttribute("src", imageURL);

        //5. Load Ingredient Amount
        newIngredientItem.querySelector(".ingredient-name").textContent = item["name"];
        newIngredientItem.querySelector(".ingredient-details").textContent = item["measures"]["us"]["amount"] + " " + item["measures"]["us"]["unitLong"];

        //6. Append to Container
        ingredientContainer.appendChild(newIngredientItem);
    });
}

function loadDirections(recipeDirections) {
    let instructionsContainer = document.getElementById("instructions");
    instructionsContainer.querySelectorAll("article").forEach((child) => {
        instructionsContainer.removeChild(child);
    });
    recipeDirections.map((item) => {
        //1. Get number and direction for each step
        let newInstructionItem = document.querySelector("#templateInstructionItem").content.cloneNode(true);
        newInstructionItem.querySelector(".instruction-number").textContent = item["number"];
        newInstructionItem.querySelector(".instruction-text").textContent = item["step"];

        //2. Get ingredients for each step
        let ingreidentViewer = newInstructionItem.querySelectorAll(".instruction-viewer")[0];
        loadIcons(item["ingredients"], "Ingredients", ingreidentViewer);

        //3. Get equipment for each step
        let equipmentViewer = newInstructionItem.querySelectorAll(".instruction-viewer")[1];
        loadIcons(item["equipment"], "Equipment", equipmentViewer);

        //4. Appead to Child
        instructionsContainer.appendChild(newInstructionItem);
    });

    addGeneralEventListeners();
    handleNotice("", true);
}

function handleNotice(inputNotice, disappear) {
    let existingElement = document.querySelector(".search-notice");
    if (disappear == true && existingElement != null) {
        existingElement.style.display = "none";
    } else if (disappear == false && existingElement != null) {
        existingElement.textContent = inputNotice;
        existingElement.removeAttribute("style");
    } else {
        let noticeElement = document.createElement("h4");
        noticeElement.setAttribute("class", "search-notice");
        noticeElement.textContent = inputNotice
        document.querySelector("header").appendChild(noticeElement);
    }
    removeSearchingElement();
}

function loadIcons(iconItems, title, parent) {
    if (iconItems.length == 0) {
        parent.style.display = "none";
        return null;
    } 
    parent.innerHTML = "";
    parent.setAttribute("data-id", title);

    //1. Create Title
    let viewerTitle = document.createElement("div");
    viewerTitle.setAttribute("class", "instruction-viewer-title");
    viewerTitle.textContent = title;
    parent.appendChild(viewerTitle);

    //2. Create Icon Viewer Items
    let iconViewerItems = document.createElement("div");
    iconViewerItems.setAttribute("class", "instruction-viewer-items");
    parent.appendChild(iconViewerItems);

    //2. Load Each Image
    iconItems.map((item) => {
        let newIconContainer = document.createElement("div");
        newIconContainer.setAttribute("class", "instruction-viewer-icon-container");

        let newIconImage = document.createElement("img");
        newIconImage.setAttribute("src", (title == "Equipment" ? EQUIPMENT_BASE_URL : INGREDIENT_BASE_URL ) + item["image"].toString());
        newIconImage.setAttribute("class", "instruction-viewer-icon");
        newIconContainer.appendChild(newIconImage);

        let newIconText = document.createElement("p");
        newIconText.textContent = item["name"];
        newIconText.setAttribute("class", "icon-caption")
        newIconContainer.append(newIconText);

        iconViewerItems.appendChild(newIconContainer);
    });
}

/*********************************/

data_response = {
    "recipie_list": [{
        "recipe_url":"https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fimages.media-allrecipes.com%2Fuserphotos%2F4579463.jpg",
        "recipe_title": "Grain-Free Chicken Parm",
        "recipe_description": "A healthier version of a classic!",
        "ingredients_note": "Based on 2 servings",
        "ingredients_list": [
            {
                "summary": "1/2 pound unsalted raw almonds",
                "name": "unsalted raw almonds",
                "amount": 0.5,
                "units": "pound"
            },
            {
                "summary": "1 (8 ounce) package shredded Parmesan cheese, divided",
                "name": "shredded Parmesan cheese",
                "amount": 8,
                "units": "ounces" 
            },
            {
                "summary": "salt and ground black pepper to taste",
                "name": "salt and pepper",
                "amount": 1,
                "units": "pinch"
            },
            {
                "summary": "1 pinch dried Italian seasoning, or to taste",
                "name": "dried Italian seasoning",
                "amount": 1,
                "units": "pinch"
            },
            {
                "summary": "2 boneless chicken breast halves",
                "name": "boneless chicken breast halves",
                "amount": 2,
                "units": "chicken breast halves"
            },
            {
                "summary": "1 tablespoon coconut oil",
                "name": "coconut oil",
                "amount": 1,
                "units": "tablespoon"
            },
            {
                "summary": "1 (14 ounce) jar pasta sauce",
                "name": "pasta sauce",
                "amount": 14,
                "units": "ounce"
            }
        ],
        "directions": [
            "Preheat oven to 400 degrees F (200 degrees C).",
            "Blend almonds in a blender or food processor to the consistency of bread crumbs. Transfer ground almonds to a shallow dish and add 2 tablespoons Parmesan cheese, salt, pepper, and Italian seasoning.",
            "Place chicken in a resealable plastic bag and pound, using a meat mallet, until about 1-inch thick.",
            "Press chicken into almond mixture until evenly coated.",
            "Heat coconut oil in a skillet over medium heat; cook chicken until a nice crust forms, about 5 minutes per side. Transfer chicken to a baking sheet.",
            "Bake in the preheated oven until chicken is no longer pink in the center, 20 to 25 minutes. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C).",
            "Heat pasta sauce in a saucepan over medium heat until warmed through, 3 to 4 minutes. Pour over cooked chicken and top with remaining Parmesan cheese.",
            "Turn on oven's broiler. Broil chicken Parmesan until cheese is bubbling and golden, about 3 minutes.",
        ],
        "nutritional_facts": {
            "summary": "1492 calories; 104 g total fat; 168 mg cholesterol; 2672 mg sodium. 54 g carbohydrates; 94.5 g protein",
            "calories": {
                "amount": 1492,
                "units": "calories",
            },
            "total_fat": {
                "amount": 104,
                "units": "g",
            },
            "cholesterol": {
                "amount": 168,
                "units": "mg",
            },
            "sodium": {
                "amount": 2672,
                "units": "mg",},
            "carbohydrates": {
                "amount": 54,
                "units": "g",},
            "protein": {
                "amount": 94.5,
                "units": "g",
            }
        }
    }],
}

dinner_postman_response = {
    "vegetarian": true,
    "vegan": false,
    "glutenFree": true,
    "dairyFree": false,
    "veryHealthy": true,
    "cheap": false,
    "veryPopular": true,
    "sustainable": false,
    "weightWatcherSmartPoints": 12,
    "gaps": "no",
    "lowFodmap": false,
    "preparationMinutes": 10,
    "cookingMinutes": 6,
    "aggregateLikes": 1501,
    "spoonacularScore": 100,
    "healthScore": 69,
    "pricePerServing": 240.25,
    "extendedIngredients": [
        {
            "id": 1019,
            "aisle": "Cheese",
            "image": "feta.png",
            "consistency": "solid",
            "name": "feta cheese",
            "original": "2 tbsp feta cheese",
            "originalString": "2 tbsp feta cheese",
            "originalName": "feta cheese",
            "amount": 2,
            "unit": "tbsp",
            "meta": [],
            "metaInformation": [],
            "measures": {
                "us": {
                    "amount": 2,
                    "unitShort": "Tbsps",
                    "unitLong": "Tbsps"
                },
                "metric": {
                    "amount": 2,
                    "unitShort": "Tbsps",
                    "unitLong": "Tbsps"
                }
            }
        },
        {
            "id": 11215,
            "aisle": "Produce",
            "image": "garlic.png",
            "consistency": "solid",
            "name": "garlic clove",
            "original": "1 garlic clove, minced",
            "originalString": "1 garlic clove, minced",
            "originalName": "garlic clove, minced",
            "amount": 1,
            "unit": "",
            "meta": [
                "minced"
            ],
            "metaInformation": [
                "minced"
            ],
            "measures": {
                "us": {
                    "amount": 1,
                    "unitShort": "",
                    "unitLong": ""
                },
                "metric": {
                    "amount": 1,
                    "unitShort": "",
                    "unitLong": ""
                }
            }
        },
        {
            "id": 1002030,
            "aisle": "Spices and Seasonings",
            "image": "pepper.jpg",
            "consistency": "solid",
            "name": "ground pepper",
            "original": "¼ tsp ground pepper",
            "originalString": "¼ tsp ground pepper",
            "originalName": "ground pepper",
            "amount": 0.25,
            "unit": "tsp",
            "meta": [],
            "metaInformation": [],
            "measures": {
                "us": {
                    "amount": 0.25,
                    "unitShort": "tsps",
                    "unitLong": "teaspoons"
                },
                "metric": {
                    "amount": 0.25,
                    "unitShort": "tsps",
                    "unitLong": "teaspoons"
                }
            }
        },
        {
            "id": 16158,
            "aisle": "Refrigerated",
            "image": "hummus.jpg",
            "consistency": "solid",
            "name": "hummus",
            "original": "1 tbsp hummus",
            "originalString": "1 tbsp hummus",
            "originalName": "hummus",
            "amount": 1,
            "unit": "tbsp",
            "meta": [],
            "metaInformation": [],
            "measures": {
                "us": {
                    "amount": 1,
                    "unitShort": "Tbsp",
                    "unitLong": "Tbsp"
                },
                "metric": {
                    "amount": 1,
                    "unitShort": "Tbsp",
                    "unitLong": "Tbsp"
                }
            }
        },
        {
            "id": 4053,
            "aisle": "Oil, Vinegar, Salad Dressing",
            "image": "olive-oil.jpg",
            "consistency": "liquid",
            "name": "olive oil",
            "original": "1 tsp olive oil",
            "originalString": "1 tsp olive oil",
            "originalName": "olive oil",
            "amount": 1,
            "unit": "tsp",
            "meta": [],
            "metaInformation": [],
            "measures": {
                "us": {
                    "amount": 1,
                    "unitShort": "tsp",
                    "unitLong": "teaspoon"
                },
                "metric": {
                    "amount": 1,
                    "unitShort": "tsp",
                    "unitLong": "teaspoon"
                }
            }
        },
        {
            "id": 10011457,
            "aisle": "Produce",
            "image": "spinach.jpg",
            "consistency": "solid",
            "name": "spinach",
            "original": "2 cups (lightly packed) spinach, thinly sliced",
            "originalString": "2 cups (lightly packed) spinach, thinly sliced",
            "originalName": "(lightly packed) spinach, thinly sliced",
            "amount": 2,
            "unit": "cups",
            "meta": [
                "packed",
                "thinly sliced",
                "(lightly )"
            ],
            "metaInformation": [
                "packed",
                "thinly sliced",
                "(lightly )"
            ],
            "measures": {
                "us": {
                    "amount": 2,
                    "unitShort": "cups",
                    "unitLong": "cups"
                },
                "metric": {
                    "amount": 473.176,
                    "unitShort": "ml",
                    "unitLong": "milliliters"
                }
            }
        },
        {
            "id": 11507,
            "aisle": "Produce",
            "image": "sweet-potato.png",
            "consistency": "solid",
            "name": "sweet potato",
            "original": "1 medium sweet potato",
            "originalString": "1 medium sweet potato",
            "originalName": "sweet potato",
            "amount": 1,
            "unit": "medium",
            "meta": [],
            "metaInformation": [],
            "measures": {
                "us": {
                    "amount": 1,
                    "unitShort": "medium",
                    "unitLong": "medium"
                },
                "metric": {
                    "amount": 1,
                    "unitShort": "medium",
                    "unitLong": "medium"
                }
            }
        }
    ],
    "id": 584549,
    "title": "Stuffed Sweet Potato with Spinach, Hummus & Feta",
    "readyInMinutes": 16,
    "servings": 1,
    "sourceUrl": "http://www.cookincanuck.com/2013/09/stuffed-sweet-potato-recipe-with-spinach-hummus-feta/",
    "image": "https://spoonacular.com/recipeImages/584549-556x370.jpg",
    "imageType": "jpg",
    "summary": "Stuffed Sweet Potato with Spinach, Hummus & Fetan is a <b>gluten free and vegetarian</b> side dish. One serving contains <b>286 calories</b>, <b>10g of protein</b>, and <b>14g of fat</b>. This recipe serves 1 and costs $2.08 per serving. 1499 people have made this recipe and would make it again. If you have hummus, garlic clove, olive oil, and a few other ingredients on hand, you can make it. From preparation to the plate, this recipe takes approximately <b>16 minutes</b>. This recipe is typical of middl eastern cuisine. All things considered, we decided this recipe <b>deserves a spoonacular score of 100%</b>. This score is super. Try <a href=\"https://spoonacular.com/recipes/spinach-and-feta-hummus-499728\">Spinach and Feta Hummus</a>, <a href=\"https://spoonacular.com/recipes/spiced-sweet-roasted-red-pepper-feta-hummus-100993\">Spiced Sweet Roasted Red Pepper & feta Hummus</a>, and <a href=\"https://spoonacular.com/recipes/feta-and-spinach-stuffed-bread-471194\">Fetan and Spinach Stuffed Bread</a> for similar recipes.",
    "cuisines": [
        "Middle Eastern"
    ],
    "dishTypes": [
        "side dish"
    ],
    "diets": [
        "gluten free",
        "lacto ovo vegetarian"
    ],
    "occasions": [],
    "winePairing": {},
    "instructions": "With a fork, pierce the sweet potato in several places.  Place the sweet potato in the microwave, on top of a piece of paper towel, and cook for 3 minutes per side (about 6 minutes total), or until the sweet potato is tender when pierced with a fork.  Let the sweet potato cool for several minutes, or until cool enough to handle.  Cut in half lengthwise.  Carefully scoop out the flesh of the potato and place in a medium-sized bowl.  Reserve the skins.  With the back of a fork, mash the potato flesh until most lumps are gone.Heat the olive oil in a small skillet set over medium heat.  Add the garlic and cook for 30 seconds.Add the spinach and cook, stirring, until the spinach is wilted, about 1 minute.Add the spinach mixture to the mashed sweet potato, along with the  hummus, feta cheese and ground pepper.  Stir gently to combine.Scoop the sweet potato mixture into the reserved sweet potato skins.  Serve.",
    "analyzedInstructions": [
        {
            "name": "",
            "steps": [
                {
                    "number": 1,
                    "step": "With a fork, pierce the sweet potato in several places.",
                    "ingredients": [
                        {
                            "id": 11507,
                            "name": "sweet potato",
                            "image": "sweet-potato.png"
                        }
                    ],
                    "equipment": []
                },
                {
                    "number": 2,
                    "step": "Place the sweet potato in the microwave, on top of a piece of paper towel, and cook for 3 minutes per side (about 6 minutes total), or until the sweet potato is tender when pierced with a fork.",
                    "ingredients": [
                        {
                            "id": 11507,
                            "name": "sweet potato",
                            "image": "sweet-potato.png"
                        }
                    ],
                    "equipment": [
                        {
                            "id": 405895,
                            "name": "paper towels",
                            "image": "paper-towels.jpg"
                        },
                        {
                            "id": 404762,
                            "name": "microwave",
                            "image": "microwave.jpg"
                        }
                    ],
                    "length": {
                        "number": 9,
                        "unit": "minutes"
                    }
                },
                {
                    "number": 3,
                    "step": "Let the sweet potato cool for several minutes, or until cool enough to handle.",
                    "ingredients": [
                        {
                            "id": 11507,
                            "name": "sweet potato",
                            "image": "sweet-potato.png"
                        }
                    ],
                    "equipment": []
                },
                {
                    "number": 4,
                    "step": "Cut in half lengthwise.  Carefully scoop out the flesh of the potato and place in a medium-sized bowl.  Reserve the skins.  With the back of a fork, mash the potato flesh until most lumps are gone.",
                    "ingredients": [],
                    "equipment": [
                        {
                            "id": 404783,
                            "name": "bowl",
                            "image": "bowl.jpg"
                        }
                    ]
                },
                {
                    "number": 5,
                    "step": "Heat the olive oil in a small skillet set over medium heat.",
                    "ingredients": [
                        {
                            "id": 4053,
                            "name": "olive oil",
                            "image": "olive-oil.jpg"
                        }
                    ],
                    "equipment": [
                        {
                            "id": 404645,
                            "name": "frying pan",
                            "image": "pan.png"
                        }
                    ]
                },
                {
                    "number": 6,
                    "step": "Add the garlic and cook for 30 seconds.",
                    "ingredients": [
                        {
                            "id": 11215,
                            "name": "garlic",
                            "image": "garlic.png"
                        }
                    ],
                    "equipment": []
                },
                {
                    "number": 7,
                    "step": "Add the spinach and cook, stirring, until the spinach is wilted, about 1 minute.",
                    "ingredients": [
                        {
                            "id": 10011457,
                            "name": "spinach",
                            "image": "spinach.jpg"
                        }
                    ],
                    "equipment": [],
                    "length": {
                        "number": 1,
                        "unit": "minutes"
                    }
                },
                {
                    "number": 8,
                    "step": "Add the spinach mixture to the mashed sweet potato, along with the  hummus, feta cheese and ground pepper.  Stir gently to combine.Scoop the sweet potato mixture into the reserved sweet potato skins.",
                    "ingredients": [
                        {
                            "id": 1002030,
                            "name": "ground black pepper",
                            "image": "pepper.jpg"
                        },
                        {
                            "id": 11507,
                            "name": "sweet potato",
                            "image": "sweet-potato.png"
                        },
                        {
                            "id": 1019,
                            "name": "feta cheese",
                            "image": "feta.png"
                        },
                        {
                            "id": 10011457,
                            "name": "spinach",
                            "image": "spinach.jpg"
                        },
                        {
                            "id": 16158,
                            "name": "hummus",
                            "image": "hummus.jpg"
                        }
                    ],
                    "equipment": []
                },
                {
                    "number": 9,
                    "step": "Serve.",
                    "ingredients": [],
                    "equipment": []
                }
            ]
        }
    ],
    "sourceName": null,
    "creditsText": null,
    "originalId": null
}

quesadilla_postman_response = {
    "vegetarian": false,
    "vegan": false,
    "glutenFree": false,
    "dairyFree": false,
    "veryHealthy": false,
    "cheap": false,
    "veryPopular": false,
    "sustainable": false,
    "weightWatcherSmartPoints": 0,
    "gaps": "no",
    "lowFodmap": false,
    "preparationMinutes": 5,
    "cookingMinutes": 5,
    "aggregateLikes": 0,
    "spoonacularScore": 0,
    "healthScore": 0,
    "pricePerServing": 0,
    "extendedIngredients": [
        {
            "id": 10218364,
            "aisle": "Bakery/Bread;Pasta and Rice;Ethnic Foods",
            "image": "flour-tortilla.jpg",
            "consistency": "solid",
            "name": "flour tortillas",
            "original": "4 Flour tortillas (approximately 8-inches wide)",
            "originalString": "4 Flour tortillas (approximately 8-inches wide)",
            "originalName": "Flour tortillas (approximately 8-inches wide)",
            "amount": 4,
            "unit": "8-inch",
            "meta": [
                "(approximately es wide)"
            ],
            "metaInformation": [
                "(approximately es wide)"
            ],
            "measures": {
                "us": {
                    "amount": 4,
                    "unitShort": "8-inch",
                    "unitLong": "8-inchs"
                },
                "metric": {
                    "amount": 4,
                    "unitShort": "8-inch",
                    "unitLong": "8-inchs"
                }
            }
        },
        {
            "id": 1005114,
            "aisle": "Meat",
            "image": "rotisserie-chicken.png",
            "consistency": "solid",
            "name": "chicken meat",
            "original": "1 cup cooked, shredded or chopped, chicken meat",
            "originalString": "1 cup cooked, shredded or chopped, chicken meat",
            "originalName": "cooked, shredded or chopped, chicken meat",
            "amount": 1,
            "unit": "cup",
            "meta": [
                "shredded",
                "cooked",
                "chopped"
            ],
            "metaInformation": [
                "shredded",
                "cooked",
                "chopped"
            ],
            "measures": {
                "us": {
                    "amount": 1,
                    "unitShort": "cup",
                    "unitLong": "cup"
                },
                "metric": {
                    "amount": 236.588,
                    "unitShort": "ml",
                    "unitLong": "milliliters"
                }
            }
        },
        {
            "id": 1001025,
            "aisle": "Cheese",
            "image": "shredded-cheese-white.jpg",
            "consistency": "solid",
            "name": "monterey jack cheese",
            "original": "1/4 lb cheddar or Monterey jack cheese, sliced or grated",
            "originalString": "1/4 lb cheddar or Monterey jack cheese, sliced or grated",
            "originalName": "cheddar or Monterey jack cheese, sliced or grated",
            "amount": 0.25,
            "unit": "lb",
            "meta": [
                "grated",
                "sliced"
            ],
            "metaInformation": [
                "grated",
                "sliced"
            ],
            "measures": {
                "us": {
                    "amount": 0.25,
                    "unitShort": "lb",
                    "unitLong": "pounds"
                },
                "metric": {
                    "amount": 113.398,
                    "unitShort": "g",
                    "unitLong": "grams"
                }
            }
        },
        {
            "id": 9003,
            "aisle": "Produce",
            "image": "apple.jpg",
            "consistency": "solid",
            "name": "apple",
            "original": "1 apple, sliced",
            "originalString": "1 apple, sliced",
            "originalName": "apple, sliced",
            "amount": 1,
            "unit": "",
            "meta": [
                "sliced"
            ],
            "metaInformation": [
                "sliced"
            ],
            "measures": {
                "us": {
                    "amount": 1,
                    "unitShort": "",
                    "unitLong": ""
                },
                "metric": {
                    "amount": 1,
                    "unitShort": "",
                    "unitLong": ""
                }
            }
        },
        {
            "id": 6164,
            "aisle": "Pasta and Rice;Ethnic Foods",
            "image": "salsa.png",
            "consistency": "solid",
            "name": "salsa",
            "original": "1/4 cup salsa",
            "originalString": "1/4 cup salsa",
            "originalName": "salsa",
            "amount": 0.25,
            "unit": "cup",
            "meta": [],
            "metaInformation": [],
            "measures": {
                "us": {
                    "amount": 0.25,
                    "unitShort": "cups",
                    "unitLong": "cups"
                },
                "metric": {
                    "amount": 59.147,
                    "unitShort": "ml",
                    "unitLong": "milliliters"
                }
            }
        }
    ],
    "id": -1,
    "title": "Apple Chicken Quesadilla",
    "readyInMinutes": 10,
    "servings": 12,
    "sourceUrl": "https://www.simplyrecipes.com/recipes/apple_chicken_quesadilla",
    "image": "https://www.simplyrecipes.com/wp-content/uploads/2006/10/apple-chicken-quesadilla-vertical-a-1800.jpg",
    "imageType": "jpg",
    "summary": null,
    "cuisines": [],
    "dishTypes": [],
    "diets": [],
    "occasions": [],
    "winePairing": {},
    "instructions": "Heat the tortilla until puffy: Heat a large skillet on medium high heat. Place one tortilla in the skillet.\nFlip it a couple of times with a spatula, then let it sit in the pan heating up until air pockets form and parts of the tortilla begin to puff up. Flip it again.\n\nAdd cheese and chicken, fold over: Place cheese slices on half of the tortilla, at least 1/2-inch from the edge of the tortilla. Add chicken pieces on top of the cheese. Fold the tortilla over like an omelette, and press down on the folded tortilla with the spatula. Lower the heat to medium.\n \nAt this point, if you have enough room in your skillet, you can add a second tortilla to the pan to begin to heat it up.\n\nAdd apple slices and salsa, cut into triangles: When the cheese inside the quesadilla has melted, remove the quesadilla to a cutting board. Open it wide and layer on apple slices and salsa.\n \nFold the tortilla back again, and cut it into 3 triangles, as if you were cutting a pie. (You don't have to cut the quesadilla into triangles, it just makes it easier for kids to eat.)\n\nRepeat with the remaining tortillas.",
    "analyzedInstructions": [
        {
            "name": "",
            "steps": [
                {
                    "number": 1,
                    "step": "Heat the tortilla until puffy: ",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": []
                },
                {
                    "number": 2,
                    "step": "Heat a large skillet on medium high heat.",
                    "ingredients": [],
                    "equipment": [
                        {
                            "id": 404645,
                            "name": "frying pan",
                            "image": "pan.png"
                        }
                    ]
                },
                {
                    "number": 3,
                    "step": "Place one tortilla in the skillet.",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": [
                        {
                            "id": 404645,
                            "name": "frying pan",
                            "image": "pan.png"
                        }
                    ]
                },
                {
                    "number": 4,
                    "step": "Flip it a couple of times with a spatula, then let it sit in the pan heating up until air pockets form and parts of the tortilla begin to puff up. Flip it again.",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": [
                        {
                            "id": 404642,
                            "name": "spatula",
                            "image": "spatula-or-turner.jpg"
                        },
                        {
                            "id": 404645,
                            "name": "frying pan",
                            "image": "pan.png"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Add cheese and chicken, fold over",
            "steps": [
                {
                    "number": 1,
                    "step": "Place cheese slices on half of the tortilla, at least 1/2-inch from the edge of the tortilla.",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": []
                },
                {
                    "number": 2,
                    "step": "Add chicken pieces on top of the cheese. Fold the tortilla over like an omelette, and press down on the folded tortilla with the spatula. Lower the heat to medium.",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": [
                        {
                            "id": 404642,
                            "name": "spatula",
                            "image": "spatula-or-turner.jpg"
                        }
                    ]
                },
                {
                    "number": 3,
                    "step": "At this point, if you have enough room in your skillet, you can add a second tortilla to the pan to begin to heat it up.",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": [
                        {
                            "id": 404645,
                            "name": "frying pan",
                            "image": "pan.png"
                        }
                    ]
                },
                {
                    "number": 4,
                    "step": "Add apple slices and salsa, cut into triangles: When the cheese inside the quesadilla has melted, remove the quesadilla to a cutting board. Open it wide and layer on apple slices and salsa.",
                    "ingredients": [
                        {
                            "id": 9003,
                            "name": "apple",
                            "image": "apple.jpg"
                        },
                        {
                            "id": 6164,
                            "name": "salsa",
                            "image": "salsa.png"
                        }
                    ],
                    "equipment": [
                        {
                            "id": 404716,
                            "name": "cutting board",
                            "image": "cutting-board.jpg"
                        }
                    ]
                },
                {
                    "number": 5,
                    "step": "Fold the tortilla back again, and cut it into 3 triangles, as if you were cutting a pie. (You don't have to cut the quesadilla into triangles, it just makes it easier for kids to eat.)",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": []
                },
                {
                    "number": 6,
                    "step": "Repeat with the remaining tortillas.",
                    "ingredients": [
                        {
                            "id": 18364,
                            "name": "tortilla",
                            "image": "flour-tortilla.jpg"
                        }
                    ],
                    "equipment": []
                }
            ]
        }
    ],
    "sourceName": null,
    "creditsText": null,
    "originalId": null
}

