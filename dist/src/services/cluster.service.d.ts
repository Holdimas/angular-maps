import { ClusterLayerDirective } from '../components/cluster-layer';
import { LayerService } from './layer.service';
/**
 * Abstract class to to define teh cluster layer service contract. Must be realized by implementing provider.
 *
 * @export
 * @abstract
 */
export declare abstract class ClusterService extends LayerService {
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof ClusterService
     */
    abstract StartClustering(layer: ClusterLayerDirective): Promise<void>;
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof ClusterService
     */
    abstract StopClustering(layer: ClusterLayerDirective): Promise<void>;
}
