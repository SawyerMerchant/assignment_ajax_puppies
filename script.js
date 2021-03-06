function Puppy(name, breed, created_at, id) {
  this.name = name;
  this.breed = breed;
  this.created_at = created_at;
  this.id = id;
}

function Breed(name, id){
  console.log(this);
  this.name = name;
  this.id = id;
}

var model = {
  // init: function() {
  //   model.puppies = [];
  //   model.breeds = [];
  // },

  addPuppy: function(puppyName, puppyBreed, created_at, id) {
    model.puppies.push(new Puppy(puppyName, puppyBreed, created_at, id));
  },

  createPuppyList: function(response) {
    model.puppies = [];
    for(var puppy in response) {
      var pup = response[puppy];
      model.addPuppy(pup.name, pup.breed, pup.created_at, pup.id);
    }
  },

  createBreedList: function(response) {
    model.breeds = [];
    for(var breed in response) {
     model.breeds.push(new Breed(response[breed].name, response[breed].id));
    }
  }
};

var controller = {
  init: function() {
    // model.init(); // do this first
    API.getBreeds();
    API.getPuppyList();
    view.submitButtonListener();
    view.refreshListener();
    view.puppyListListener();
    API.doneWaiting();
  },

  submitButtonHandler: function(e) {
    e.preventDefault();

    var puppyName = view.getPuppyName();
    var breedID = view.getPuppyBreedID();

    if(puppyName) {
      API.sendPuppy(puppyName, breedID);
      view.renderAddedPuppy();
      view.clearInput();
    } else {
      view.nameError();
    }
  }
};

var view = {

  submitButtonListener: function() {

    $("#submit-button").on("click", controller.submitButtonHandler);
  },

  refreshListener: function() {
    $("#refresh").on("click", view.updatePuppies);
  },

  updatePuppies: function() {
    API.getPuppyList();
    view.renderPuppyList(model.puppies);
  },

  puppyListListener: function() {
    $("#puppy-list").on("click", "button", function(e) {
      e.preventDefault();
      $id = $(e.target).data("id");
      API.adoptPuppy($(e.target).data("id"));
      view.removePuppy($id);
    });
  },

  removePuppy: function(id) {
    // console.log($id);
    $adoptedPuppy = $('[data-id=' + id + ']').parent();
    // console.log($adoptedPuppy);
    $adoptedPuppy.remove();
  },

  getPuppyName: function() {
    return $("#puppy-name").val();
  },

  getPuppyBreedID: function() {
    return $("select").val();
  },

  clearInput: function() {
    $('#puppy-name').val("");
  },


  renderAddedPuppy: function() {
    $list = $('#puppy-list');
    $name = $('#puppy-name').val();
    $breed = $('select option:selected').text();
    $postAge = jQuery.timeago($.now());
    $newli = $('<li></li>').text($name + " (" +
                          $breed + "), created" + $postAge);
    $list.prepend( $newli );
  },

  renderPuppyList: function(puppyList) {
    $list = $('#puppy-list');
    $list.empty();

    for (var puppy in puppyList) {
      var $postAge = jQuery.timeago(puppyList[puppy].created_at);
      $newli = $('<li></li>')
        .text(puppyList[puppy].name + " (" + puppyList[puppy].breed.name + "), created " + $postAge)
        .append( $('<button>Adopt</button>').attr('data-id', puppyList[puppy].id) );
      $list.append( $newli );
    }
  },

  renderBreedList: function(breedList) {
    $select = $("select");
    $select.empty();
    for(var b in breedList) {
      $option = $("<option>");
      $option.text(breedList[b].name)
            .val(breedList[b].id);
      $select.append($option);
    }
  },

  nameError: function() {
    $("#flash-messages").empty()
                        .text("Failed. Errors were: Puppy Name is required to be present");
    setTimeout(function(){
      $("flash-messages").empty();
    }, 2000);
  }
};

var API = {
  puppyListReturn: false,
  breedsListReturn: false,
  count: 0,

  getPuppyList: function() {
    var puppyPromise =  $.ajax({ url: "https://ajax-puppies.herokuapp.com/puppies.json",
              success: function(response) {
                puppyListReturn = true;
                model.createPuppyList(response);
              }
    });
    return puppyPromise;
  },

  getBreeds: function() {
    var breedPromise =  $.ajax({ url: "https://ajax-puppies.herokuapp.com/breeds.json",
              success: function(response) {
                breedsListReturn = true;
                model.createBreedList(response);
              }
    });
  },

  doneWaiting: function() {
    var $msg = $("#waiting-message");
    var waitingForAPI = setInterval (function() {
      if (API.count >= 1) {
        $msg.empty()
            .text("Sorry this is taking so long...");
      }
      if (puppyListReturn === true && breedsListReturn === true){
        // view.render(model.puppies, model.breeds);
        view.renderPuppyList(model.puppies);
        view.renderBreedList(model.breeds);
        $msg.empty()
            .text("Finished")
            .css('color', 'green');
        setTimeout(function() {
          $("#waiting").hide('slowly');
        }, 500);
        clearInterval(waitingForAPI);
      }
      API.count +=1;
    }, 1000);
  },

  sendPuppy: function(name, breedID) {
    options = {
      url: 'https://ajax-puppies.herokuapp.com/puppies.json',
      method: 'POST',
      contentType: 'application/json',
      dataType: "json",
      data: JSON.stringify({name: name, breed_id: breedID}),
      success: function() {
        $('#flash-messages').empty()
                            .text("Thank you for adding a puppy. Let's find them a great home!");
                          },
      error: function() {
        $('#flash-messages').empty()
                            .text("We are sorry, something went wrong. Please try again.");
                          }
    };

    $.ajax(options);

  },

  adoptPuppy: function(puppyID) {
    options = {
      url: 'https://ajax-puppies.herokuapp.com/puppies/' + puppyID + '.json',
      method: 'DELETE',
      success: function() {
        $('#flash-messages').empty()
                            .text("Thank you. We hope that you and your new puppy have fun together!");
        setTimeout(function(){
          $('#flash-messages').empty();
        }, 4000);
      },
      error: function() {
        $('#flash-messages').empty()
                            .text("We are sorry, something went wrong. Please try again.");
      }
    };

    $.ajax(options);
  }


};

$(document).ready(function() {
  jQuery("time.timeago").timeago();
  controller.init();
});
