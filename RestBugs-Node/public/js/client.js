var board = angular.module('board', []);
function BoardController($scope, $http) {

  $scope.init = function(){

    $scope.categories = [];
    $scope.parser = new DOMParser();

    $scope.rels = _.map(restbugs.init.links, function(link){ // Move to load
      return {
        rel: $(link).attr("rel"), 
        href: $(link).attr("href")
      };
    });

    $scope.load();

    $(".addFormContainer").html(restbugs.init.addForm);


    // Hijax the add form container
    $("form.new").submit(function(){
      
      var $that = $(this);      
      $.post($(this).attr("action"), $(this).serialize()).done(function(){
        
        $scope.load();
        
        // Empty the input fields
        $(".addFormContainer").hide();
        _.each($("input[type!=submit]", $that.parent()), function(item){
          $(item).val("");
        });
      });

      return false;
    });
  }

  $scope.load = function(){
          
    var rels = $scope.rels;
      
    _.each(rels, function(link, index){
      
      $http.get($(link).attr("href")).success(function(data){                  
        
        var bugsDiv = $(data).filter(function(){ return $(this).attr("id") === "bugs" });
      
        $scope.loadBugs(bugsDiv, link, index);
      });      
    });

    // Ugly fix, try using $.when instead
    setTimeout(function(){
      $scope.bindActions();
      $scope.enableDragAndDrop();    
    }, 500);
    
  }

  $scope.loadBugs = function(bugsDiv, link, index){
    
    var bugs = restbugs.domain.getBugs(bugsDiv);

    var viewModel = {
      name: $(link).attr("rel"), 
      bugs: bugs, 
      order: index
    };
    
    var indexForCategory = $scope.getIndexForCategory(viewModel.name);        
    if (indexForCategory === -1)
      $scope.categories.push(viewModel);
    else
      $scope.categories[indexForCategory] = viewModel;  
  }

  $scope.bindActions = function(){
    // Hijax the move forms
    $("form.move").submit(function(){      
      console.log("Wohoo, moving bug");
      var $that = $(this);      
      $.post($(this).attr("action"), $(this).serialize()).done(function(){        
        $scope.load();                
      });

      return false;
    });
  }

  $scope.move = function(args){
    var action = args.action;
    
    if (action.method === "POST") {
      $http.post(action.action, {id: action.id}).success(function(data) {
        $scope.load();
      });
    }
    else {
      // Possible future support for PUT, etc..
    }
  }

  $scope.getIndexForCategory = function(name){
    var category = _.find($scope.categories, function(c, i){ return c.name === name});
    return _.indexOf($scope.categories, category);
  }

  $scope.add = function(){
    $(".addFormContainer").toggle();
  }

  $scope.enableDragAndDrop = function(){

    var onDropped = function(event, ui){
      
      var targetClass = $(this).parent(".category").attr("class");
      var targetCategory = targetClass.split(" ")[1];

      var draggable = $(ui.draggable);
      $("form." + targetCategory + " input[type=submit]", draggable).click()
    
    };

    $(".bug").draggable({ snap: ".droparea" });
    $(".droparea").droppable({drop: onDropped});
  }

  $scope.init();
}

var restbugs = window.restbugs || {};
restbugs.init = restbugs.init || (function() {
  "use strict";

  var module = {
    load : function (){
      this.links = $("a[rel!=index]");      
      this.addForm = $("form.new");

      // Load template and bootstrap angular
      $.ajax({url: "/templates.html"}).done(function(templates){  
   
        var template = $("#angular-template", $(templates)).text();

        $("body").html(template);
        $("body").show();
        $(".addFormContainer").hide();

        var containerElement = $('body');
        angular.bootstrap(containerElement, ['board']); 
      });
    }
  }    
      
  return module;
}());

var restbugs = window.restbugs || {};
restbugs.domain = restbugs.dodmain || (function() {
  "use strict";

  var module = {
    getBugs : function (bugsDiv){
      var bugsToParse = $(".all li", bugsDiv);

      var parseBug = function(bugToParse){
        
        var parseAction =function(form){        
          return {
            action: $(form).attr("action"),
            nextCategory: $(form).attr("class").split(" ")[1], // TODO Make more robust
            method: $(form).attr("method"),
            id: $("input[name=id]", form).attr("value"),
            name: $("input[name=submit]", form).attr("value"),
            cssClass: $(form).attr("class")
          };
        };

        var actions = _.map($("form", bugToParse), parseAction);
                
        var formsHtml = _.map($("form", bugToParse).clone().wrap('<p>').parent(), function(item){
          return $(item).html()
        }).join("\n");

        return {
          title: $(".title", bugToParse).text(),
          description: $(".description", bugToParse).text(),
          actions: actions,
          forms: formsHtml
        };
    };

    var bugs = _.map(bugsToParse, parseBug);
    return bugs;
    }
  }    
      
  return module;
}());

$(function(){
  restbugs.init.load();
});
