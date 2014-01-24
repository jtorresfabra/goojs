define([
	'goo/renderer/bounds/BoundingBox',
	'goo/entities/components/Component',
	'goo/renderer/MeshData'
],
/** @lends */
function (
	BoundingBox,
	Component,
	MeshData
) {
	'use strict';

	/**
	 * @class Holds the mesh data, like vertices, normals, indices etc. Also defines the local bounding volume.
	 * @param {MeshData} meshData Target mesh data for this component.
	 */
	function MeshDataComponent(meshData) {
		this.type = 'MeshDataComponent';

		this.meshData = meshData;

		/** Bounding volume in local space
		 * @type {BoundingVolume}
		 * @default
		 */
		this.modelBound = new BoundingBox();
		/** Automatically compute bounding fit
		 * @type {boolean}
		 * @default
		 */
		this.autoCompute = true;
		this.currentPose = null; // SkeletonPose
	}

	MeshDataComponent.type = 'MeshDataComponent';

	MeshDataComponent.prototype = Object.create(Component.prototype);
	MeshDataComponent.prototype.constructor = MeshDataComponent;

	/**
	 * Set the bounding volume type (sphere, box etc)
	 *
	 * @param {BoundingVolume} modelBound Bounding to apply to this meshdata component
	 * @param {boolean} autoCompute If true, automatically compute bounding fit
	 */
	MeshDataComponent.prototype.setModelBound = function (modelBound, autoCompute) {
		this.modelBound = modelBound;
		this.autoCompute = autoCompute;
	};

	/**
	 * Compute bounding center and bounds for this mesh
	 */
	MeshDataComponent.prototype.computeBoundFromPoints = function () {
		if (this.autoCompute && this.modelBound !== null && this.meshData) {
			var verts = this.meshData.getAttributeBuffer('POSITION');
			if (verts !== undefined) {
				this.modelBound.computeFromPoints(verts);
				this.autoCompute = false;
			}
		}
	};

	MeshDataComponent.applyOnEntity = function(obj, entity) {
		if (obj instanceof MeshData) {
			var meshDataComponent = new MeshDataComponent(obj);
			entity.setComponent(meshDataComponent);
			return true;
		}
	};

	return MeshDataComponent;
});