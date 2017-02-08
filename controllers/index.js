var _ = require('underscore');

var dMVC = require('dmvc');

dMVC.TaskModel = dMVC.Model.subClass({

    validationRules: {
        task: ['Required', 'String']
    },

    /**
     * Initialization method
     * @param opt {Object}
     */
    init: function(opt) {
        _.extend(this, opt);
        this.id = _.uniqueId('model_');
    },

    toJSON: function() {
        return {
            task: this.task,
            id: this.id,
            done: this.done
        };
    }

});

dMVC.TaskMapper = dMVC.ModelMapper.subClass({

    init: function (opt) {
        this._dbAdapter.connect();
    },

    getByID: function(id) {

        var task = this._dbAdapter.find(id);
        return this.mapToTask(task);

    },

    mapToTask: function(task) {
        return new dMVC.TaskModel({
            id: task._id,
            task: task.task,
            userID: task.userID,
            done: task.done
        });
    },

    getUserTasks: function (id, callback) {
        var self = this;
        this._dbAdapter.find({userID: id}, function (rows) {
            if(rows.error) {
                callback(rows);
            } else {
                var tasks = _.map(rows, function (row) {
                    return self.mapToTask(row);
                });
                callback(tasks);
            }
        });
    },

    saveTask: function(taskModel, callback) {

        if(!taskModel.validate()) {
            callback({error: 'Validation Error'}, taskModel);
        } else {
            this._dbAdapter.save(taskModel.toJSON(), callback);
        }

    },

    deleteTask: function (id, callback) {
        this._dbAdapter.remove(id, callback);
    }

});

dMVC.AppController = dMVC.Controller.subClass({

    createTask: function(req, res, next) {
        var taskController = new dMVC.TaskController();
        taskController.newTask(req, res, next);

    },


    getTasks: function(req, res, next) {
        var taskController = new dMVC.TaskController();
        taskController.getAll(req, res, next);
    }

});

dMVC.TaskController = dMVC.Controller.subClass({

    getAll: function(req, res, next) {
        var taskMapper = new dMVC.TaskMapper({
            adapter: new dMVC.MongoDBAdapter()
        });
        taskMapper.getUserTasks(req.session.userID, function(tasks) {
            if(tasks.error) {
                res.json({error: tasks.error});
            } else {
                //TODO: implement some kind of command manager
                var commands = _.map(tasks, function(task) {
                    return {
                        command: 'create',
                        id: task.id,
                        text: task.task,
                        done: task.done
                    }
                });
                res.json(commands);
            }
        });

    },

    //TODO: stopped here - same ID for diff views
    newTask: function(req, res, next) {

        var task = new dMVC.TaskModel({
            task: req.body.data,
            id: req.body.cid,
            done: false
        });

        var taskMapper = new dMVC.TaskMapper({
            adapter: new dMVC.MemoryDBAdapter()
        });
        taskMapper.saveTask(task, function (err, record) {
            if(err) {
                //TODO: handle error
                res.json([{error: err}]);
            } else {
                //console.log(record);
                res.json([{
                    command: 'create',
                    id: record.id,
                    text: record.task,
                    done: record.done
                }]);
            }
        });

    },

    deleteTask: function(req, res, next) {
        var taskMapper = new dMVC.TaskMapper({
            adapter: new dMVC.MemoryDBAdapter()
        });
        taskMapper.deleteTask(req.body.cid, function(err) {
            if(err) {
                //TODO: handle error
                res.json([]);
            } else {
                res.json([{
                    command: 'delete',
                    id: req.body.cid
                }]);
            }

        });

    }

});

dMVC.TopMenuController = dMVC.Controller.subClass({

    contactPressed: function(req, res, next) {
        res.json([
            {command: 'hideJumbo'},
            {command: 'showContacts'}
        ]);
    },

    goHome: function(req, res, next) {
        res.json([
            {command: 'showJumbo'},
            {command: 'homePage'}
        ]);
    },

    quickStart: function(req, res, next) {
        res.json([
            {command: 'hideJumbo'},
            {command: 'quickStartPage'}
        ]);
    }

});

dMVC.BreadcrumbController = dMVC.Controller.subClass({

    goHome: function(req, res, next) {
        res.json([
            {command: 'showJumbo'},
            {command: 'homePage'}
        ]);
    }

});


module.exports = dMVC.router;