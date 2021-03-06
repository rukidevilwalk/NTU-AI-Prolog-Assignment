import subway_interactor from './core.js'


console.log('Version' + ' 1')
// Init

//Init prolog session
var session = pl.create()
session.consult(subway_interactor)
session.consult(":- use_module(library(dom)).")
session.consult(":- use_module(library(js)).")
session.consult(":- use_module(library(lists)).")
session.consult(":- use_module(library(random)).")
// Declare variables
let currentProgress = 'meals'
let nextItem = false

// For ingredients with multiple selections
let orderContents = {
  meat: '',
  veggie: '',
  sauce: '',
  topup: '',
  side: ''
}

// Update user's dialogue box contents
function updateUserDialogueBox(contents) {
  if (contents == '') {
    $('#user-contents')
      .empty()
      .append('None for me')
      .end()
  } else {
    $('#user-contents')
      .empty()
      .append('I would like ' + contents)
      .end()
  }
}

// Update subway staff's dialogue box contents
function updateStaffDialogueBox(contents) {
  $('#subway-header')
    .empty()
    .append(contents)
    .end()

  $('#subway-contents')
    .empty()
    .end()
}

$('#nextItem').click(function () {
  nextItem = true
})

$('#newOrder').click(function () {
  location.reload()
})

// Listener for dynamically created buttons
// Carry out logic whenever an item button is clicked
$(document).click(function (e) {

  if ($(e.target).is("button")) {

    let selectedIngredient = $(e.target).text().toUpperCase()
    let fact = $(e.target).text()

    // Carry out functions based on current progress
    switch (currentProgress) {

      case 'meals':
        updateMeal(selectedIngredient, fact)
        break

      case 'breads':
        updateBread(selectedIngredient, fact)
        break

      case 'meats':
        updateMeats(selectedIngredient, fact)
        break

      case 'veggies':
        updateVeggies(selectedIngredient, fact)
        break

      case 'sauces':
        updateSauces(selectedIngredient, fact)
        break

      case 'topups':
        updateTopups(selectedIngredient, fact)
        break

      case 'sides':
        updateSides(selectedIngredient, fact)
        break

      default:
        break
    }

  }

})

function updateMeal(selectedIngredient, fact) {
  // Update Dialogue
  updateUserDialogueBox(selectedIngredient)
  updateStaffDialogueBox(selectedIngredient +
    ' meal? Alright. <br /> How about your bread?')

  // Call prolog to assert selected item 
  session.query(`selected(${fact},meals).`)
  session.answer()

  //Call prolog to update menu items
  $("#btn-group").empty()
  session.query("options(breads).")
  session.answer()

  currentProgress = 'breads'
}

function updateBread(selectedIngredient, fact) {
  // Update Dialogue
  updateUserDialogueBox(selectedIngredient)

  // Call prolog to assert selected item 
  session.query(`selected(${fact},breads).`)
  session.answer()

  // Call prolog to check if meat needs to be displayed 
  session.query(`get_meats(X).`)
  session.answer(result => {
    if (pl.type.is_substitution(result)) {
      // If result is empty, that means vegan or veggies was selected
      if (result.lookup('X') == '[]') {
        // Update Dialogue
        updateStaffDialogueBox(selectedIngredient +
          ' bread, good choice. <br /> Since you wanted a non-meat meal, what would you like for your veggies?')

        //Call prolog to update menu items
        $("#btn-group").empty()
        session.query("options(veggies).")
        session.answer()
        currentProgress = 'veggies'
      } else {
        // Update Dialogue
        updateStaffDialogueBox(selectedIngredient +
          ' bread, good choice.<br /> What would you like for your meat?')
        $("#btn-group").empty()

        //Call prolog to update menu items
        session.query("options(meats).")
        session.answer()
        currentProgress = 'meats'
      }
    }
  })

  $('#nextItem').show()
}

function updateMeats(selectedIngredient, fact) {
  if (nextItem) {
    // Update Dialogue
    updateUserDialogueBox(orderContents.meat)
    if (orderContents.meat == '')
      orderContents.meat = 'No meat'
    // Call prolog to check if meat needs to be displayed 
    session.query(`get_veggies(X).`)
    session.answer(result => {
      if (pl.type.is_substitution(result)) {
        // Update Dialogue
        updateStaffDialogueBox(orderContents.meat +
          ' , gotcha! <br /> Any veggies for you?')

        //Call prolog to update menu items
        nextItem = false;
        $("#btn-group").empty()
        session.query("options(veggies).")
        session.answer()
      }

      currentProgress = 'veggies'
    })
  } else {

    orderContents.meat = orderContents.meat + (orderContents.meat != '' ? ' , ' : '') + selectedIngredient
    // Call prolog to assert selected item 
    session.query(`selected(${fact},meats).`)
    session.answer()
  }
}

function updateVeggies(selectedIngredient, fact) {
  if (nextItem) {
    // Update Dialogue
    updateUserDialogueBox(orderContents.veggie)
    if (orderContents.veggie == '')
      orderContents.veggie = 'No veggie'
    // Call prolog to check what kind of sauces need to be displayed 
    // non-fat sauces for healthy meals
    session.query(`get_sauces(X).`)
    session.answer(result => {
      if (pl.type.is_substitution(result)) {
        // Prolog replies with Non-fat sauces
        if (result.lookup('X') == '[[honey_mustard, sweet_onion, yelow_mustard, deli_brown_mustard]]') {
          // Update Dialogue
          updateStaffDialogueBox(orderContents.veggie +
            ' , affirmative. <br /> Since you wanted a healthy meal, any non-fat sauces to accompany that?')

          //Call prolog to update menu items
          $("#btn-group").empty()
          session.query("options(sauces).")
          session.answer()
        } else {
          // Update Dialogue
          updateStaffDialogueBox('Okay so ' + orderContents.veggie + '. ' +
            '<br /> Sauces?')

          //Call prolog to update menu items
          $("#btn-group").empty()
          session.query("options(sauces).")
          session.answer()
        }
        nextItem = false
      }
    })
    currentProgress = 'sauces'
  } else {
    orderContents.veggie = orderContents.veggie + (orderContents.veggie != '' ? ' , ' : '') + selectedIngredient
    // Call prolog to assert selected item 
    session.query(`selected(${fact},veggies).`)
    session.answer()
  }
}

function updateSauces(selectedIngredient, fact) {
  if (nextItem) {
    // Update Dialogue
    updateUserDialogueBox(orderContents.sauce)
    if (orderContents.sauce == '')
      orderContents.sauce = 'No sauce'
    // Call prolog to check if topups need to be displayed 
    session.query(`get_topups(X).`)
    session.answer(result => {
      if (pl.type.is_substitution(result)) {
        // If result is empty, that means value meal was selected
        let result1 = result.lookup('X')
        if (result1 == '[]') {
          // Update Dialogue
          updateStaffDialogueBox(orderContents.sauce +
            ' ...done. <br /> Note there is no topups for value meals. <br/> Would you want to choose some sides?')

          //Call prolog to update menu items
          $("#btn-group").empty()
          session.query("options(sides).")
          session.answer()
          $("#nextItem").html('Confirm Order');
          currentProgress = 'sides'
        } else if (result1 == '[[avocado, egg_mayo]]') {
          // Update Dialogue
          updateStaffDialogueBox(orderContents.sauce +
            '? Okay. <br /> For your vegan meal, any non-cheese topups for you?')

          //Call prolog to update menu items
          $("#btn-group").empty()
          session.query("options(topups).")
          session.answer()
          currentProgress = 'topups'
        } else {
          // Update Dialogue
          updateStaffDialogueBox(orderContents.sauce +
            ' , I guess that works too. <br /> Would you like to topup anything else?')

          //Call prolog to update menu items
          $("#btn-group").empty()
          session.query("options(topups).")
          session.answer()
          currentProgress = 'topups'
        }
        nextItem = false
      }
    })
  } else {
    orderContents.sauce = orderContents.sauce + (orderContents.sauce != '' ? ' , ' : '') + selectedIngredient
    // Call prolog to assert selected item 
    session.query(`selected(${fact},sauces).`)
    session.answer()
  }
}

function updateTopups(selectedIngredient, fact) {
  if (nextItem) {
    // Update Dialogue
    updateUserDialogueBox(orderContents.topup)
    if (orderContents.topup == '')
      orderContents.topup = 'No topup'
    updateStaffDialogueBox('Alright '+ orderContents.topup +
      ' has been added.<br /> Sides for you?')

    //Call prolog to update menu items
    nextItem = false
    $("#btn-group").empty()
    session.query("options(sides).")
    session.answer()
    $("#nextItem").html('Confirm Order');
    currentProgress = 'sides'
  } else {
    orderContents.topup = orderContents.topup + (orderContents.topup != '' ? ' , ' : '') + selectedIngredient
    // Call prolog to assert selected item 
    session.query(`selected(${fact},topups).`)
    session.answer()
  }
}

function updateSides(selectedIngredient, fact) {
  if (nextItem) {

    $('#nextItem').hide()
    $('#selection-area').hide()
    $('#newOrder').show()
    // Update Dialogue
    updateUserDialogueBox(orderContents.side)
    if (orderContents.side == '')
      orderContents.side = 'No side'
    updateStaffDialogueBox(orderContents.side + ' to go! <br/> Here is your order:')

    // Call Prolog to display final order
    session.query(`displaySelections(1).`)
    session.answer()
  } else {
    orderContents.side = orderContents.side + (orderContents.side != '' ? ' , ' : '') + selectedIngredient
    // Call prolog to assert selected item 
    session.query(`selected(${fact},sides).`)
    session.answer()
  }
}

// Init interaction for first ingredient
//updateStaffDialogueBox('Welcome to Subway! What kind of meal would you like?')
$("#btn-group").empty()
// Call Prolog to display menu for meal selection
session.query("setStaffBehaviour(list).")
session.answer()
session.query("options(meals).")
session.answer()
