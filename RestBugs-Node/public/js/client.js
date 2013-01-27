// TODO
// btn-primary for nexts

function(){

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
          $scope.loadAndRender();
        });
      }
      else {
        // Possible future support for PUT, etc..
      }
    }

    $scope.add = function(){
      $(".addFormContainer").toggle();
    }

    $scope.loadAndRender = function(){
              
      var rels = $scope.rels;
        
      _.each(rels, function(link, index){
        
        $http.get($(link).attr("href")).success(function(data){                  
          
          var xmlDoc = parser.parseFromString(data,"text/xml");
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

          _.defer(function(){
            $(".bug").draggable({ snap: ".droparea" });
            $(".droparea").droppable({drop: function(event, ui){

              var targetClass = $(this).parent(".category").attr("class");
              var targetCategory = targetClass.split(" ")[1];

              var draggable = $(ui.draggable);
              var button = $("button." + targetCategory, draggable);            

              if (button.length === 0) {
                $scope.loadAndRender();
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
            }});  
          });
          
        });      
      });   
    }

    var parser = new DOMParser();
    $http.get(window.selfUrl).success(function(data) {
      
      $scope.categories = [];
            
      var links = $("a[rel!=index]", data);      
      var addForm = $("form.new", data);
      $(".addFormContainer").html(addForm);

      $scope.rels = _.map(links, function(link){
        return {
          rel: $(link).attr("rel"), 
          href: $(link).attr("href")
        };
      });

      $scope.loadAndRender();

    });    
  }

  $(function(){
      
    window.selfUrl = $("a[rel=index]").attr("href");

    // Load template and bootstrap angular
    $.ajax({url: "/templates.html"}).done(function(templates){  
       
      var template = $("#angular-template", $(templates)).text();

      $("body").html(template);
      $("body").show();
      $(".addFormContainer").hide();
      var containerElement = $('body');
      angular.bootstrap(containerElement, ['myModule']); 
    });

  });

}();
