import React from "react";

const ImageContext = React.createContext({
  selectedImage: [],
  croppedImage: [],
  pathToSave: "",
  addToSelectedImage: () => {},
  addToCroppedImages: () => {},
  removeFromCroppedImage: () => {},
  addToPath: () => {},
  resetSelectedImage: () => {},
  addAllImg:()=>{}
});

export default ImageContext;
