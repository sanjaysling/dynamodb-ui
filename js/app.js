
  var app = angular.module('ddbclient', ['datatables']);

  // AWS.config.update({ accessKeyId: "myKeyId", secretAccessKey: "secretKey", region: "us-east-1" });
  AWS.config.maxRetries = 0 ;

  app.controller('ConnectionController', function($scope){
    $scope.host = "localhost";
    $scope.port = "8000";
    $scope.tableNames = [];
    $scope.connectionError = "";
    $scope.selectedTableName = "  ";
    $scope.selectedTableHashKey = null;
    $scope.selectedTableRangeKey = null;
    $scope.dbitems = [];
    $scope.showTable = false ;
    $scope.connected = false ;
    $scope.createContent = "";
    $scope.createItemError = "";
    $scope.createItemSuccess = "";

    $scope.updateContent = "";
    $scope.updateItemError = "";

    $scope.accessKey = "" ;
    $scope.secretKey = "";
    $scope.region = "" ;

    $scope.tabSelected = "";

    $scope.selectedTableNameListId = null ;


    $scope.connect = function(){
      if(this.host){
        $('#hostNameGroup').removeClass('has-error');
        if(this.port){
          $('#portGroup').removeClass('has-error');

          $('#mainTableData').hide();
          $scope.showTable = false ;
          
          if($scope.tabSelected === "local"){
              console.log("Connecting using "+this.host+":"+this.port);
              AWS.config.update({ accessKeyId: "myKeyId", secretAccessKey: "secretKey", region: "us-east-1" });
              $scope.ddbClient = new AWS.DynamoDB({ endpoint: new AWS.Endpoint('http://'+this.host+':'+this.port) , dynamoDbCrc32: false});
              $scope.ddbDocumentClient = new AWS.DynamoDB.DocumentClient({ endpoint: new AWS.Endpoint('http://'+this.host+':'+this.port) , dynamoDbCrc32: false});
          }else if($scope.tabSelected === "aws"){
              console.log("Connecting using accessKey: "+$scope.accessKey+", secretKey: "+$scope.secretKey+" and region: "+$scope.region);
              AWS.config.update({ accessKeyId: $scope.accessKey, secretAccessKey: $scope.secretKey, region: $scope.region });
              $scope.ddbClient = new AWS.DynamoDB({dynamoDbCrc32: false});
              $scope.ddbDocumentClient = new AWS.DynamoDB.DocumentClient({dynamoDbCrc32: false});
          }

         
          $scope.ddbClient.listTables(function (err, data){
            if (err) {
              console.log(err);
              $scope.connectionError = "Connection Failed   " ;
              
              $('#hostNameGroup').addClass('has-error');
              $('#portGroup').addClass('has-error');

            }else{
              console.log("Tables fetched: "+JSON.stringify(data));
              $scope.connected = true ;
              $('#hostNameGroup').removeClass('has-error');
              $('#portGroup').removeClass('has-error');
              
              $('#newConnectionModal').modal('hide');
              $scope.connectionError = "" ;
              $scope.tableNames = data.TableNames ;
              console.log($scope.tableNames);
            }
            $scope.$apply();

          });
        }else{
          $('#portGroup').addClass('has-error');
        }
      }else{
        $('#hostNameGroup').addClass('has-error');
      }
    };

    $scope.onTabSelected = function(tabName){
        $scope.tabSelected = tabName ;
    }

    $scope.isValidJson = function(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;

        // input text disabled based on scope property
    }

    $scope.initializeCreateItem = function(){
      $scope.createItemError = "";
      var initItem = {};
      if($scope.selectedTableHashKey != null){
        initItem[$scope.selectedTableHashKey] = "";
      }
      if($scope.selectedTableRangeKey != null){
        initItem[$scope.selectedTableRangeKey] = "";
      }
      
      
      $scope.createContent = JSON.stringify( initItem, function( key, value ) {
          if( key === "$$hashKey" ) {
              return undefined;
          }

          return value;
      }, 4);
    }

    $scope.createItem = function(tableName){
      var isValid = $scope.isValidJson($scope.createContent);

      console.log("isValid JSON: "+isValid);

      if(isValid){
          var params = {
            TableName: ''+tableName,
            Item: JSON.parse($scope.createContent)

          };

          // var docClient = $scope.dyn.DocumentClient();
          $scope.ddbDocumentClient.put(params, function(err, data) {
            if (err) {
              console.log(err); // an error occurred}
              $scope.createItemError = err.message ;
              $scope.$apply();
            }else {
                console.log(JSON.stringify(data)); // successful response
                $("#createItemModal").modal('hide');
                $scope.createItemError = "";
                $scope.createContent = "";
                $scope.scanTable($scope.selectedTableName);
            }
          });
          
      }else{
        $scope.createItemError = "Invalid JSON   ";
      }

      

    };

    $scope.updateItem = function(tableName){
      console.log($scope.updateContent);
      var isValid = $scope.isValidJson($scope.updateContent);
      if(isValid){
          var params = {
            TableName: ''+tableName,
            Item: JSON.parse($scope.updateContent)

          };

          $scope.ddbDocumentClient.put(params, function(err, data) {
            if (err) {
              console.log(err); // an error occurred}
              $scope.updateItemError = err.message ;
              $scope.$apply();
            }else {
                console.log(JSON.stringify(data)); // successful response
                $("#updateItemModal").modal('hide');
                $scope.updateItemError = "";
                $scope.updateContent = "";
                $scope.scanTable($scope.selectedTableName);
            }
          });

      }else{
        $scope.updateItemError = "Invalid JSON   ";
      }
    };

    $scope.deleteItem = function(){
      var isValid = $scope.isValidJson($scope.updateContent);
      if(isValid){
        var jsonContentObj = JSON.parse($scope.updateContent)
        var hashKeyValue = jsonContentObj[$scope.selectedTableHashKey];
        var tempObj = {};

        if($scope.selectedTableHashKey != null){
          tempObj[$scope.selectedTableHashKey] = hashKeyValue;
        }
        // if($scope.selectedTableRangeKey != null){
        //   initItem[$scope.selectedTableRangeKey] = "";
        // }

        var params = {
          TableName : ''+$scope.selectedTableName,
          Key: tempObj
        };

        $scope.ddbDocumentClient.delete(params, function(err, data) {
          if (err){
           
            console.log(err); // an error occurred}
              $scope.updateItemError = err.message ;
              $scope.$apply();
          } else{
            console.log(data);
            $scope.updateItemError = "";
            $("#updateItemModal").modal('hide');
            $("#confirm-delete").modal('hide');
            $scope.updateContent = "";
            $scope.scanTable($scope.selectedTableName);
          } 
        });


      }else{
        $scope.updateItemError = "Invalid JSON   ";
      }
    };

    $scope.viewRecord = function(content){

      var contentData = JSON.stringify( content, function( key, value ) {
          if( key === "$$hashKey" ) {
              return undefined;
          }

          return value;
      }, 4);

      // $('#updateItemContent').text("");
      $('#updateItemModal').modal('show');
      // $('#updateItemContent').val(contentData);
      $scope.updateContent = contentData ;
    };

    $scope.query = function(tableName){
        var partitionValue = $('#queryPartitionKey').val();

        var params = {
            TableName : ''+tableName,
            KeyConditionExpression: "#key = :value",
            ExpressionAttributeNames:{
                "#key": "" + $scope.selectedTableHashKey
            },
            ExpressionAttributeValues: {
                ":value": parseInt(partitionValue)
            }
        };

        $scope.ddbDocumentClient.query(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log("Query succeeded.");
                console.log(JSON.stringify(data));
                $scope.dbitems  = data.Items ;
                
                $scope.$apply();
            }
        });
    }

  $scope.scanTable = function(tableName){

    if($scope.selectedTableNameListId){
      $('#'+$scope.selectedTableNameListId).removeClass("active");
    }
    $('#'+tableName).addClass("active");
    $scope.selectedTableNameListId = tableName ;

    $scope.showTable = true ;
    $('#mainTableData').show();
    $scope.selectedTableName = tableName ;

    var params2 = {
      TableName: tableName /* required */
    };
    $scope.ddbClient.describeTable(params2, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else{
        console.log(JSON.stringify(data));           // successful response
        var hashRangeKeys = data.Table.KeySchema;
        console.log(JSON.stringify(hashRangeKeys));      


        for (var key in hashRangeKeys) {
          if (hashRangeKeys.hasOwnProperty(key)) {
            if(hashRangeKeys[key].KeyType === 'HASH'){
              $scope.selectedTableHashKey = hashRangeKeys[key].AttributeName;
              console.log(hashRangeKeys[key].AttributeName);
            }else if (hashRangeKeys[key].KeyType === 'RANGE'){
              $scope.selectedTableRangeKey = hashRangeKeys[key].AttributeName;
            }
            
          }
        }


      }
    });

      var params = {
        TableName: tableName
      };
      // var docClient = $scope.dyn.DocumentClient();
      $scope.ddbDocumentClient.scan(params, function(err, data) {
        if (err) {
          console.log("Scan error "+err); // an error occurred}
        }else {
          console.log("Raw data "+ JSON.stringify(data));
          $scope.dbitems  = data.Items ;
          
          $('#ddbDataTable').dataTable();

          $scope.$apply();
        }
    });

    };

  });



