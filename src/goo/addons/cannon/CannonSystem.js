define([
	'goo/entities/systems/System',
	'goo/renderer/bounds/BoundingBox',
	'goo/renderer/bounds/BoundingSphere',
	'goo/math/Quaternion',
	'goo/math/Transform',
	'goo/math/Vector3',
	'goo/util/ObjectUtil'
],
/** @lends */
function(
	System,
	BoundingBox,
	BoundingSphere,
	Quaternion,
	Transform,
	Vector3,
	_
) {
	'use strict';

	var CANNON = window.CANNON;

	/**
	 * @class Cannon.js physics system. Depends on the global CANNON object, so load cannon.js using a script tag before using this system. See also {@link CannonRigidbodyComponent}.
	 * @extends System
	 * @param [Object] settings. The settings object can contain the following properties:
	 * @param {number} settings.stepFrequency (defaults to 60)
	 * @example
	 * var cannonSystem = new CannonSystem({
	 *     stepFrequency: 60,
	 *     gravity: new Vector3(0, -10, 0)
	 * });
	 * goo.world.setSystem(cannonSystem);
	 */
	function CannonSystem(settings) {
		System.call(this, 'CannonSystem', ['CannonRigidbodyComponent','TransformComponent']);

		settings = settings || {};

		_.defaults(settings, {
			gravity :		new Vector3(0, -10, 0),
			stepFrequency : 60
		});

		var world = this.world = new CANNON.World();
		world.gravity.x = settings.gravity.x;
		world.gravity.y = settings.gravity.y;
		world.gravity.z = settings.gravity.z;
		world.broadphase = new CANNON.NaiveBroadphase();

		this.stepFrequency = settings.stepFrequency;

		this._quat = new Quaternion();
	}

	CannonSystem.prototype = Object.create(System.prototype);

	CannonSystem.prototype.inserted = function(entity) {
		var rbComponent = entity.cannonRigidbodyComponent;
		var transformComponent = entity.transformComponent;

		var shape = rbComponent.createShape(entity);
		if (!shape) {
			entity.clearComponent('CannonComponent');
			return;
		}

		var body = new CANNON.RigidBody(rbComponent.mass, shape);
		body.position.set(transformComponent.transform.translation.x, transformComponent.transform.translation.y, transformComponent.transform.translation.z);
		var v = rbComponent._initialVelocity;
		body.velocity.set(v.x, v.y, v.z);
		var q = this._quat;
		q.fromRotationMatrix(transformComponent.transform.rotation);
		body.quaternion.set(q.x, q.y, q.z, q.w);
		rbComponent.body = body;

		this.world.add(body);

		var c = entity.cannonDistanceJointComponent;
		if(c){
			this.world.addConstraint(c.createConstraint(entity));
		}
	};

	CannonSystem.prototype.deleted = function(entity) {
		var rbComponent = entity.cannonRigidbodyComponent;

		if (rbComponent) {
			// TODO: remove joints?
			this.world.remove(rbComponent.body);
		}
	};

	CannonSystem.prototype.process = function(entities /*, tpf */) {

		// Step the world forward in time
		this.world.step(1 / this.stepFrequency);

		// Update positions of entities from the physics data
		for (var i = 0; i < entities.length; i++) {
			var entity = entities[i];
			var cannonComponent = entity.cannonRigidbodyComponent;

			var position = cannonComponent.body.position;
			entity.transformComponent.setTranslation(position.x, position.y, position.z);

			var cannonQuat = cannonComponent.body.quaternion;
			this._quat.set(cannonQuat.x, cannonQuat.y, cannonQuat.z, cannonQuat.w);
			entity.transformComponent.transform.rotation.copyQuaternion(this._quat);
			entity.transformComponent.setUpdated();
		}
	};

	return CannonSystem;
});
