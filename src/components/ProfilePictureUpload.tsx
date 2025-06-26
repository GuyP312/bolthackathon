import React, { useState, useRef, useCallback } from 'react';


import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';


import { Camera, X, Check } from 'lucide-react';


import 'react-image-crop/dist/ReactCrop.css';





interface ProfilePictureUploadProps {


  onImageUpdate: (imageUrl: string) => void;


  onClose: () => void;


  loading?: boolean;


}





const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({


  onImageUpdate,


  onClose,


  loading = false


}) => {


  const [imgSrc, setImgSrc] = useState<string>('');


  const [crop, setCrop] = useState<Crop>();


  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();


  const imgRef = useRef<HTMLImageElement>(null);


  const hiddenFileInput = useRef<HTMLInputElement>(null);


  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');





  function centerAspectCrop(


    mediaWidth: number,


    mediaHeight: number,


    aspect: number,


  ) {


    return centerCrop(


      makeAspectCrop(


        {


          unit: '%',


          width: 90,


        },


        aspect,


        mediaWidth,


        mediaHeight,


      ),


      mediaWidth,


      mediaHeight,


    );


  }





  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {


    if (e.target.files && e.target.files.length > 0) {


      const reader = new FileReader();


      reader.addEventListener('load', () =>


        setImgSrc(reader.result?.toString() || ''),


      );


      reader.readAsDataURL(e.target.files[0]);


    }


  };





  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {


    const { width, height } = e.currentTarget;


    setCrop(centerAspectCrop(width, height, 1));


  };





  const getCroppedImg = useCallback(


    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {


      const canvas = document.createElement('canvas');


      const ctx = canvas.getContext('2d');





      if (!ctx) {


        throw new Error('No 2d context');


      }





      const scaleX = image.naturalWidth / image.width;


      const scaleY = image.naturalHeight / image.height;





      const pixelRatio = window.devicePixelRatio;





      canvas.width = Math.floor(crop.width * scaleX * pixelRatio);


      canvas.height = Math.floor(crop.height * scaleY * pixelRatio);





      ctx.scale(pixelRatio, pixelRatio);


      ctx.imageSmoothingQuality = 'high';





      const cropX = crop.x * scaleX;


      const cropY = crop.y * scaleY;





      ctx.drawImage(


        image,


        cropX,


        cropY,


        crop.width * scaleX,


        crop.height * scaleY,


        0,


        0,


        crop.width * scaleX,


        crop.height * scaleY,


      );





      return new Promise((resolve) => {


        canvas.toBlob((blob) => {


          if (blob) {


            resolve(blob);


          }


        }, 'image/jpeg', 0.95);


      });


    },


    []


  );





  const handleCropComplete = useCallback(async () => {


    if (completedCrop?.width && completedCrop?.height && imgRef.current) {


      try {


        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);


        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);


        setCroppedImageUrl(croppedImageUrl);


      } catch (error) {


        console.error('Error cropping image:', error);


      }


    }


  }, [completedCrop, getCroppedImg]);





  const handleUpload = async () => {


    if (croppedImageUrl) {


      onImageUpdate(croppedImageUrl);


    }


  };





  const handleFileClick = () => {


    hiddenFileInput.current?.click();


  };





  const handleStartOver = () => {


    setImgSrc('');


    setCrop(undefined);


    setCompletedCrop(undefined);


    setCroppedImageUrl('');


  };





  return (


    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">


      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">


        <div className="flex items-center justify-between p-4 border-b">


          <h3 className="text-lg font-semibold text-gray-800">Upload Profile Picture</h3>


          <button


            onClick={onClose}


            className="p-2 hover:bg-gray-100 rounded-full transition-colors"


          >


            <X size={20} />


          </button>


        </div>





        <div className="p-6">


          {!imgSrc && (


            <div className="text-center">


              <div 


                onClick={handleFileClick}


                className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer"


              >


                <Camera size={48} className="mx-auto text-gray-400 mb-4" />


                <p className="text-gray-600 mb-2">Click to select an image</p>


                <p className="text-sm text-gray-500">Supported formats: JPG, PNG, GIF</p>


              </div>


              <input


                ref={hiddenFileInput}


                type="file"


                accept="image/*"


                onChange={onSelectFile}


                className="hidden"


              />


            </div>


          )}





          {imgSrc && !croppedImageUrl && (


            <div className="space-y-4">


              <div className="text-center">


                <p className="text-gray-600 mb-4">Adjust the crop area to frame your profile picture</p>


                <ReactCrop


                  crop={crop}


                  onChange={(_, percentCrop) => setCrop(percentCrop)}


                  onComplete={(c) => setCompletedCrop(c)}


                  aspect={1}


                  circularCrop


                  className="mx-auto"


                >


                  <img


                    ref={imgRef}


                    alt="Crop me"


                    src={imgSrc}


                    onLoad={onImageLoad}


                    className="max-w-full max-h-96"


                  />


                </ReactCrop>


              </div>


              <div className="flex gap-2 justify-center">


                <button


                  onClick={handleStartOver}


                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"


                >


                  Choose Different Image


                </button>


                <button


                  onClick={handleCropComplete}


                  disabled={!completedCrop?.width || !completedCrop?.height}


                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"


                >


                  Apply Crop


                </button>


              </div>


            </div>


          )}





          {croppedImageUrl && (


            <div className="space-y-4">


              <div className="text-center">


                <p className="text-gray-600 mb-4">Preview your cropped profile picture</p>


                <div className="inline-block">


                  <img


                    src={croppedImageUrl}


                    alt="Cropped preview"


                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"


                  />


                </div>


              </div>


              <div className="flex gap-2 justify-center">


                <button


                  onClick={handleStartOver}


                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"


                >


                  Start Over


                </button>


                <button


                  onClick={handleUpload}


                  disabled={loading}


                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"


                >


                  {loading ? (


                    <>


                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>


                      Uploading...


                    </>


                  ) : (


                    <>


                      <Check size={16} />


                      Upload Picture


                    </>


                  )}


                </button>


              </div>


            </div>


          )}


        </div>


      </div>


    </div>


  );


};





export default ProfilePictureUpload;