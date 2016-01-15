'use strict';

var _ = require('lodash');
var InstanceContext = require('../../../../base/InstanceContext');
var InstanceResource = require('../../../../base/InstanceResource');
var ListResource = require('../../../../base/ListResource');
var TaskQueueStatisticsList = require(
    './taskQueue/taskQueueStatistics').TaskQueueStatisticsList;
var TaskQueuesStatisticsList = require(
    './taskQueue/taskQueuesStatistics').TaskQueuesStatisticsList;
var values = require('../../../../base/values');

var TaskQueueList;
var TaskQueueInstance;
var TaskQueueContext;

/**
 * Initialize the TaskQueueList
 *
 * :param Version version: Version that contains the resource
 * :param workspaceSid: The workspace_sid
 *
 * @returns TaskQueueList
 */
function TaskQueueList(version, workspaceSid) {
  function TaskQueueListInstance(sid) {
    return TaskQueueListInstance.get(sid);
  }

  TaskQueueListInstance._version = version;
  // Path Solution
  TaskQueueListInstance._solution = {
    workspaceSid: workspaceSid
  };
  TaskQueueListInstance._uri = _.template(
    '/Workspaces/<%= workspaceSid%>/TaskQueues' // jshint ignore:line
  )(TaskQueueListInstance._solution);

  // Components
  TaskQueueListInstance._statistics = undefined;

  /**
   * Streams TaskQueueInstance records from the API.
   * This operation lazily loads records as efficiently as possible until the limit
   * is reached.
   * The results are passed into the callback function, so this operation is memory efficient.
   *
   * @param string [opts.friendlyName] - The friendly_name
   * @param string [opts.evaluateWorkerAttributes] - The evaluate_worker_attributes
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         list() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize=50] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no pageSize is defined but a limit is defined,
   *         list() will attempt to read the limit with the most efficient
   *         page size, i.e. min(limit, 1000)
   * @param {Function} opts.callback - A callback function to process records
   */
  TaskQueueListInstance.stream = function stream(opts) {
    var limits = this._version.readLimits({
      limit: opts.limit,
      pageSize: opts.pageSize
    });

    var page = this.page(
      opts
    );

    return this._version.stream(page, limits.limit, limits.pageLimit);
  };

  /**
   * Lists TaskQueueInstance records from the API as a list.
   *
   * @param string [opts.friendlyName] - The friendly_name
   * @param string [opts.evaluateWorkerAttributes] - The evaluate_worker_attributes
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         list() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no page_size is defined but a limit is defined,
   *         list() will attempt to read the limit with the most
   *         efficient page size, i.e. min(limit, 1000)
   *
   * @returns {Array} A list of records
   */
  TaskQueueListInstance.list = function list(opts) {
    var limits = this._version.readLimits({
      limit: opts.limit,
      pageSize: opts.pageSize,
    });

    return this.page(
      opts,
      limits.pageSize
    );
  };

  /**
   * Retrieve a single page of TaskQueueInstance records from the API.
   * Request is executed immediately
   *
   * @param string [opts.friendlyName] - The friendly_name
   * @param string [opts.evaluateWorkerAttributes] - The evaluate_worker_attributes
   * @param {string} [opts.pageToken] - PageToken provided by the API
   * @param {number} [opts.pageNumber] -
   *          Page Number, this value is simply for client state
   * @param {number} [opts.pageSize] - Number of records to return, defaults to 50
   *
   * @returns Page of TaskQueueInstance
   */
  TaskQueueListInstance.page = function page(opts) {
    var params = values.of({
      'Friendlyname': opts.friendlyName,
      'Evaluateworkerattributes': opts.evaluateWorkerAttributes,
      'PageToken': page_token,
      'Page': page_number,
      'PageSize': page_size
    });

    var response = this._version.page(
      'GET',
      self._uri,
      params
    );

    return TaskQueuePage(
      this._version,
      response,
      this._solution.workspaceSid
    );
  };

  /**
   * Create a new TaskQueueInstance
   *
   * @param string friendlyName - The friendly_name
   * @param string reservationActivitySid - The reservation_activity_sid
   * @param string assignmentActivitySid - The assignment_activity_sid
   * @param string [opts.targetWorkers] - The target_workers
   * @param string [opts.maxReservedWorkers] - The max_reserved_workers
   *
   * @returns Newly created TaskQueueInstance
   */
  TaskQueueListInstance.create = function create(friendlyName,
                                                  reservationActivitySid,
                                                  assignmentActivitySid, opts) {
    var data = values.of({
      'Friendlyname': friendlyName,
      'Reservationactivitysid': reservationActivitySid,
      'Assignmentactivitysid': assignmentActivitySid,
      'Targetworkers': opts.targetWorkers,
      'Maxreservedworkers': opts.maxReservedWorkers
    });

    var payload = this._version.create({
      uri: this._uri,
      method: 'POST',
      data: data,
    });

    return new TaskQueueInstance(
      this._version,
      payload,
      this._solution.workspaceSid
    );
  };

  Object.defineProperty(TaskQueueListInstance,
    'statistics', {
    get: function statistics() {
      if (!this._statistics) {
        this._statistics = new TaskQueuesStatisticsList(
          this._version,
          this._solution.workspaceSid
        );
      }

      return this._statistics;
    },
  });

  /**
   * Constructs a TaskQueueContext
   *
   * :param sid - The sid
   *
   * @returns TaskQueueContext
   */
  TaskQueueListInstance.get = function get(sid) {
    return new TaskQueueContext(
      this._version,
      this._solution.workspaceSid,
      sid
    );
  };

  return TaskQueueListInstance;
}


/**
 * Initialize the TaskQueueContext
 *
 * @param {Version} version - Version that contains the resource
 * @param {object} payload - The instance payload
 * @param {sid} workspaceSid: The workspace_sid
 * @param {sid} sid: The sid
 *
 * @returns {TaskQueueContext}
 */
function TaskQueueInstance(version, payload, workspaceSid, sid) {
  InstanceResource.prototype.constructor.call(this, version);

  // Marshaled Properties
  this._properties = {
    accountSid: payload.account_sid, // jshint ignore:line,
    assignmentActivitySid: payload.assignment_activity_sid, // jshint ignore:line,
    assignmentActivityName: payload.assignment_activity_name, // jshint ignore:line,
    dateCreated: payload.date_created, // jshint ignore:line,
    dateUpdated: payload.date_updated, // jshint ignore:line,
    friendlyName: payload.friendly_name, // jshint ignore:line,
    maxReservedWorkers: payload.max_reserved_workers, // jshint ignore:line,
    reservationActivitySid: payload.reservation_activity_sid, // jshint ignore:line,
    reservationActivityName: payload.reservation_activity_name, // jshint ignore:line,
    sid: payload.sid, // jshint ignore:line,
    targetWorkers: payload.target_workers, // jshint ignore:line,
    url: payload.url, // jshint ignore:line,
    workspaceSid: payload.workspace_sid, // jshint ignore:line,
  };

  // Context
  this._context = undefined;
  this._solution = {
    workspaceSid: workspaceSid,
    sid: sid || this._properties.sid,
  };
}

_.extend(TaskQueueInstance.prototype, InstanceResource.prototype);
TaskQueueInstance.prototype.constructor = TaskQueueInstance;

Object.defineProperty(TaskQueueInstance.prototype,
  '_proxy', {
  get: function() {
    if (!this._context) {
      this._context = new TaskQueueContext(
        this._version,
        this._solution.workspaceSid,
        this._solution.sid
      );
    }

    return this._context;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'accountSid', {
  get: function() {
    return this._properties.accountSid;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'assignmentActivitySid', {
  get: function() {
    return this._properties.assignmentActivitySid;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'assignmentActivityName', {
  get: function() {
    return this._properties.assignmentActivityName;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'dateCreated', {
  get: function() {
    return this._properties.dateCreated;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'dateUpdated', {
  get: function() {
    return this._properties.dateUpdated;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'friendlyName', {
  get: function() {
    return this._properties.friendlyName;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'maxReservedWorkers', {
  get: function() {
    return this._properties.maxReservedWorkers;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'reservationActivitySid', {
  get: function() {
    return this._properties.reservationActivitySid;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'reservationActivityName', {
  get: function() {
    return this._properties.reservationActivityName;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'sid', {
  get: function() {
    return this._properties.sid;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'targetWorkers', {
  get: function() {
    return this._properties.targetWorkers;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'url', {
  get: function() {
    return this._properties.url;
  },
});

Object.defineProperty(TaskQueueInstance.prototype,
  'workspaceSid', {
  get: function() {
    return this._properties.workspaceSid;
  },
});

/**
 * Fetch a TaskQueueInstance
 *
 * @returns Fetched TaskQueueInstance
 */
TaskQueueInstance.prototype.fetch = function fetch() {
  return this._proxy.fetch();
};

/**
 * Update the TaskQueueInstance
 *
 * @param string [opts.friendlyName] - The friendly_name
 * @param string [opts.targetWorkers] - The target_workers
 * @param string [opts.reservationActivitySid] - The reservation_activity_sid
 * @param string [opts.assignmentActivitySid] - The assignment_activity_sid
 * @param string [opts.maxReservedWorkers] - The max_reserved_workers
 *
 * @returns Updated TaskQueueInstance
 */
TaskQueueInstance.prototype.update = function update(opts) {
  return this._proxy.update(
    opts
  );
};

/**
 * Deletes the TaskQueueInstance
 *
 * @returns true if delete succeeds, false otherwise
 */
TaskQueueInstance.prototype.remove = function remove() {
  return this._proxy.remove();
};

/**
 * Access the statistics
 *
 * @returns statistics
 */
TaskQueueInstance.prototype.statistics = function statistics() {
  return this._proxy.statistics;
};


/**
 * Initialize the TaskQueueContext
 *
 * @param {Version} version - Version that contains the resource
 * @param {sid} workspaceSid - The workspace_sid
 * @param {sid} sid - The sid
 *
 * @returns {TaskQueueContext}
 */
function TaskQueueContext(version, workspaceSid, sid) {
  InstanceContext.prototype.constructor.call(this, version);

  // Path Solution
  this._solution = {
    workspaceSid: workspaceSid,
    sid: sid,
  };
  this._uri = _.template(
    '/Workspaces/<%= workspaceSid%>/TaskQueues/<%= sid%>' // jshint ignore:line
  )(this._solution);

  // Dependents
  this._statistics = undefined;
}

_.extend(TaskQueueContext.prototype, InstanceContext.prototype);
TaskQueueContext.prototype.constructor = TaskQueueContext;

/**
 * Fetch a TaskQueueInstance
 *
 * @returns Fetched TaskQueueInstance
 */
TaskQueueContext.prototype.fetch = function fetch() {
  var params = values.of({});

  var promise = this._version.fetch({
    method: 'GET',
    uri: this._uri,
    params: params,
  });

  promise = promise.then(function(payload) {
    return new TaskQueueInstance(
      this._version,
      payload,
      this._solution.workspaceSid,
      this._solution.sid
    );
  });

  return promise;
};

/**
 * Update the TaskQueueInstance
 *
 * @param string [opts.friendlyName] - The friendly_name
 * @param string [opts.targetWorkers] - The target_workers
 * @param string [opts.reservationActivitySid] - The reservation_activity_sid
 * @param string [opts.assignmentActivitySid] - The assignment_activity_sid
 * @param string [opts.maxReservedWorkers] - The max_reserved_workers
 *
 * @returns Updated TaskQueueInstance
 */
TaskQueueContext.prototype.update = function update(opts) {
  var data = values.of({
    'Friendlyname': opts.friendlyName,
    'Targetworkers': opts.targetWorkers,
    'Reservationactivitysid': opts.reservationActivitySid,
    'Assignmentactivitysid': opts.assignmentActivitySid,
    'Maxreservedworkers': opts.maxReservedWorkers,
  });

  var payload = this._version.update({
    uri: this._uri,
    method: 'POST',
    data: data,
  });

  return new TaskQueueInstance(
    this._version,
    payload,
    this._solution.workspaceSid,
    this._solution.sid
  );
};

/**
 * Deletes the TaskQueueInstance
 *
 * @returns true if delete succeeds, false otherwise
 */
TaskQueueContext.prototype.remove = function remove() {
  return this._version.remove(this._uri);
};

Object.defineProperty(TaskQueueContext.prototype,
  'statistics', {
  get: function() {
    if (!this._statistics) {
      this._statistics = new TaskQueueStatisticsList(
        this._version,
        this._solution.workspaceSid,
        this._solution.taskQueueSid
      );
    }
    return this._statistics;
  },
});

module.exports = {
  TaskQueueList: TaskQueueList,
  TaskQueueInstance: TaskQueueInstance,
  TaskQueueContext: TaskQueueContext
};