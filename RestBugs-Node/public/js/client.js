$(function(){
  
  // Show loading text  
  var loadingTemplate = Handlebars.compile($("#loading-template").html()); 
  $("body").html(loadingTemplate());

  // Load templates
  $.ajax({url: "templates.html"}).done(function(data){  
    var templates = data;      
    var columnTemplate = Handlebars.compile($("#column-template", $(templates)).html()); 

    $.ajax({url: $("a[rel=index]").attr("href")}).done(function(data){      
      
      var i = 1;

      var states = [];
      var rels = $("a[rel!=index]", data);
      _.each(rels, function(item){              
        var promise = $.ajax({url: $(item).attr("href")});              
        promise.then(function(data){                  

          var parser = new DOMParser();
          var xmlDoc = parser.parseFromString(data,"text/xml");

          var bugsToParse = $(".all li", $(xmlDoc.getElementById("bugs")));

          var bugs = _.map(bugsToParse, function(bugToParse){
            return {
              title: $(".title", bugToParse).text(),
              description: $(".description", bugToParse).text(),
            };
          });

          var bugsTemplate = Handlebars.compile($("#bugs-template", $(templates)).html()); 
      
          var html =  bugsTemplate({bugs: bugs});
          states.push(html);        

          if (i === rels.length) {            
            var columns = columnTemplate({html: states.join("")});
            $("body").html(columns);
          }

          i += 1;                                          
        });
                         
      });
      
    });

    $("body").html();
  });



});
