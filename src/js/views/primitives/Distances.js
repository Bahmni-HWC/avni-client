import DGS from "./DynamicGlobalStyles";

class Distances {
    static get ScaledContentDistanceFromEdge() {
        return DGS.resizeWidth(Distances.ContentDistanceFromEdge);
    }

    static get ScaledContainerHorizontalDistanceFromEdge() {
        return DGS.resizeWidth(Distances.ContainerHorizontalDistanceFromEdge);
    }

    static get ScaledVerticalSpacingBetweenOptionItems() {
        return DGS.resizeHeight(Distances.VerticalSpacingBetweenOptionItems);
    }

    static get ScaledVerticalSpacingDisplaySections() {
        return DGS.resizeHeight(Distances.VerticalSpacingDisplaySections);
    }

    static get ScaledVerticalSpacingBetweenFormElements() {
        return DGS.resizeHeight(Distances.VerticalSpacingBetweenFormElements);
    }

    static ContentDistanceFromEdge = 27;
    static ContainerHorizontalDistanceFromEdge = 24;
    static VerticalSpacingBetweenFormElements = 20;
    static VerticalSpacingDisplaySections = 16;
    static VerticalSpacingBetweenOptionItems = 20;
}

export default Distances;