from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'sexethics'
COLLECTION_NAME = 'projects'
FIELDS = {"_id" : False, 
	"UNITID_P" : True, 
	"INSTNM" : True, 
	"BRANCH" : True, 
	"City" : True, 
	"State" : True, 
	"ZIP" : True, 
	"Sector_desc" : True, 
	"men_total" : True, 
	"women_total" : True, 
	"Total" : True, 
	"FORCIB13" : True, 
	"NONFOR13" : True, 
	"RAPE14" : True, 
	"FONDL14" : True, 
	"STATR14" : True, 
	"RAPE15" : True, 
	"FONDL15" : True, 
	"STATR15" : True,}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/sexethics/projects")
def sexethics_projects():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)