// TODO
// btn-primary for nexts

var myModule = angular.module('myModule', []);
function MyController($scope, $http) {

  $scope.getIndexForCategory = function(name){
    var category = _.find($scope.categories, function(c, i){ return c.name === name});
    return _.indexOf($scope.categories, category);
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

  $scope.add = function(){
    $(".addFormContainer").toggle();
  }

  $scope.load = function(){
          
    var rels = $scope.rels;
      
    _.each(rels, function(link, index){
      
      $http.get($(link).attr("href")).success(function(data){                  
        
        var xmlDoc = parser.parseFromString(data,"text/xml");
        $scope.loadBugs(xmlDoc, link, index);
      });      
    });   
  }

  $scope.loadBugs = function(xmlDoc, link, index){
    var bugsToParse = $(".all li", $(xmlDoc.getElementById("bugs")));
    var bugs = _.map(bugsToParse, function(bugToParse){
          
      var actions = _.map($("form", bugToParse), function(form){
      
        return {
          action: $(form).attr("action"),
          nextCategory: $(form).attr("class").split(" ")[1], // TODO Make more robust
          method: $(form).attr("method"),
          id: id = $("input[name=id]", form).attr("value"),
          name: $("input[name=submit]", form).attr("value"),
        };
      });

      return {
        title: $(".title", bugToParse).text(),
        description: $(".description", bugToParse).text(),
        actions: actions            
      };
    });

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

    _.defer($scope.enableDragAndDrop);  
  }


  $scope.enableDragAndDrop = function(){

    var onDropped = function(event, ui){

      var targetClass = $(this).parent(".category").attr("class");
      var targetCategory = targetClass.split(" ")[1];

      var draggable = $(ui.draggable);
      var button = $("button." + targetCategory, draggable);            

      if (button.length === 0) {
        $scope.load();
        return;
      }             

      var sourceClass = button.parents(".category").attr("class");
      var sourceCategory = sourceClass.split(" ")[1];

      var action = {
        action: button.data("action"),
        nextCategory: targetCategory,
        method: button.data("method"),
        id: id = button.data("id")
      };

      $scope.move({currentCategory: sourceCategory, action: action});            
    };

    $(".bug").draggable({ snap: ".droparea" });
    $(".droparea").droppable({drop: onDropped});
  }

  var parser = new DOMParser();
      
  $scope.categories = [];
            
  $(".addFormContainer").html(restbugs.init.addForm);

  $scope.rels = _.map(restbugs.init.links, function(link){
    return {
      rel: $(link).attr("rel"), 
      href: $(link).attr("href")
    };
  });

  $scope.load();
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
        angular.bootstrap(containerElement, ['myModule']); 
      });
    }
  }    
      
  return module;
}());

$(function(){
  restbugs.init.load();
});
