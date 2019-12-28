// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  
  const db = admin.firestore();
  const receitas = db.collection("receitas");
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

    // http://stackoverflow.com/questions/962802#962890
    function shuffle(array) {
        var tmp, current, top = array.length;
        if(top) while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }
        return array;
    }
  //-------------------------------------------------------------------
  //-------------------------MAIN FUNCTION-----------------------------
  //-------------------------------------------------------------------
  function ingrediente(agent){
      let ingrediente = agent.parameters.Ingredientes;
        //------------------DO NOT CHANGE----------------------------
        console.log('Going to query database with: ', ingrediente);
        var i=0;
        var query = receitas;
    	var queries = [];
    
    
        for (i=0; i<ingrediente.length; i++){
          	console.log('Searching for ', ingrediente[i], ' in queries.');
          	console.log('Current query is: ', query);
            //query = query.where("ingredients", "array-contains", ingrediente[0]);
          	//query = query.where("ingredients", "==", ingrediente[i]);
          queries.push(query.where("ingredients", "array-contains", ingrediente[i]).get());
        }
    
    
        var values = null;
        var recipes = [];
        //-----------------CAN CHANGE--------------------------------
        //Executa a query na Firestore
        return Promise.all(queries).then(res => {

            console.log('Promise returned: ', res);

            res.forEach(r => { //r -> QuerySnapshot (procurem no google)
              console.log("Result: ", r); //unimportant log
              for (var a=[],i=0;i<r.size;++i) a[i]=i; //Fill an array, a, with ints from 
              //0 to QuerySnaphot size (number of returned documents) (a document is an item)
              
              
              a = shuffle(a); //Call function shuffle to randomize the array, a
              var b = []; //Para colocar um numero de receitas descomentar esta parta 
              for (i=0; i<10; i++) b[i] = a[i]; //Get the first 20 integers from a and place them in b
              
              
              i=0;  
              //Iterate over all found documents
              r.forEach(q => { //q -> DocumentSnapshot, contains a document's info (procurem no google)
                if (b.includes(i)){ //if b contains i, concat the document name (item name) (var i above should not be commented, i from previous for cycle is being used, starts at 20)
                  console.log("Got: ", q);
                  console.log("ID: ", q.get("name")); //get() returns a field (in this case, its name)

                  recipes.push(q);
                }
                
                i+=1;
              });
            });

            /*Now lets merge the recipes that have both ingredients */
            recipes.forEach(recipe => {
                /*Check if 'recipe' includes all elements of 'ingrediente'*/
                if (ingrediente.every(value => recipe.get("ingredients").includes(value))){
                    /*It does, so append to values to send to the app*/
                    if (values===null){ //Values is initially set to null so that android app knows when no item was found
                        values = '';
                      }
                      
                      values = values + recipe.id + "_"; //q.id is document id, concat it
                      values = values + recipe.get("name") + "_"; //Concat the item name, once again called using get()
                }
            });
          
            //--------------------DO NOT CHANGE----------------------------
            if (values===null){ //If values was never initialized, no items were found
                agent.add("Infelizmente não encontrei nenhuma receita com " + (ingrediente.length>1?"esses ingredientes":"esse ingrediente") + ".");
            } else{ //Otherwise, send the concat string //DO NOT CHANGE
                agent.add("Ola, com esse ingrediente, detetei_" + values);
            }
            //--------------------CAN CHANGE----------------------------
        });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Obter ingrediente', ingrediente);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
