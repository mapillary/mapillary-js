"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[8956],{3905:function(e,t,n){n.d(t,{Zo:function(){return m},kt:function(){return k}});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var o=a.createContext({}),s=function(e){var t=a.useContext(o),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},m=function(e){var t=s(e.components);return a.createElement(o.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,o=e.parentName,m=p(e,["components","mdxType","originalType","parentName"]),u=s(n),k=r,g=u["".concat(o,".").concat(k)]||u[k]||d[k]||i;return n?a.createElement(g,l(l({ref:t},m),{},{components:n})):a.createElement(g,l({ref:t},m))}));function k(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,l=new Array(i);l[0]=u;var p={};for(var o in t)hasOwnProperty.call(t,o)&&(p[o]=t[o]);p.originalType=e,p.mdxType="string"==typeof e?e:r,l[1]=p;for(var s=2;s<i;s++)l[s]=n[s];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},9722:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return p},metadata:function(){return o},toc:function(){return s},default:function(){return d}});var a=n(2122),r=n(9756),i=(n(7294),n(3905)),l={id:"viewer.Image",title:"Class: Image",sidebar_label:"Image",custom_edit_url:null},p=void 0,o={unversionedId:"classes/viewer.Image",id:"classes/viewer.Image",isDocsHomePage:!1,title:"Class: Image",description:"viewer.Image",source:"@site/api/classes/viewer.Image.md",sourceDirName:"classes",slug:"/classes/viewer.Image",permalink:"/mapillary-js/api/classes/viewer.Image",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.Image",title:"Class: Image",sidebar_label:"Image",custom_edit_url:null},sidebar:"api",previous:{title:"GraphMapillaryError",permalink:"/mapillary-js/api/classes/viewer.GraphMapillaryError"},next:{title:"MapillaryError",permalink:"/mapillary-js/api/classes/viewer.MapillaryError"}},s=[{value:"Accessors",id:"accessors",children:[{value:"cameraParameters",id:"cameraparameters",children:[]},{value:"cameraType",id:"cameratype",children:[]},{value:"capturedAt",id:"capturedat",children:[]},{value:"clusterId",id:"clusterid",children:[]},{value:"compassAngle",id:"compassangle",children:[]},{value:"computedAltitude",id:"computedaltitude",children:[]},{value:"computedCompassAngle",id:"computedcompassangle",children:[]},{value:"computedLngLat",id:"computedlnglat",children:[]},{value:"creatorId",id:"creatorid",children:[]},{value:"creatorUsername",id:"creatorusername",children:[]},{value:"exifOrientation",id:"exiforientation",children:[]},{value:"height",id:"height",children:[]},{value:"id",id:"id",children:[]},{value:"image",id:"image",children:[]},{value:"lngLat",id:"lnglat",children:[]},{value:"mergeId",id:"mergeid",children:[]},{value:"merged",id:"merged",children:[]},{value:"mesh",id:"mesh",children:[]},{value:"originalAltitude",id:"originalaltitude",children:[]},{value:"originalCompassAngle",id:"originalcompassangle",children:[]},{value:"originalLngLat",id:"originallnglat",children:[]},{value:"ownerId",id:"ownerid",children:[]},{value:"private",id:"private",children:[]},{value:"qualityScore",id:"qualityscore",children:[]},{value:"rotation",id:"rotation",children:[]},{value:"scale",id:"scale",children:[]},{value:"sequenceId",id:"sequenceid",children:[]},{value:"width",id:"width",children:[]}]}],m={toc:s};function d(e){var t=e.components,n=(0,r.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,a.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".Image"),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"classdesc"))," Represents a image in the navigation graph."),(0,i.kt)("p",null,"Explanation of position and bearing properties:"),(0,i.kt)("p",null,"When images are uploaded they will have GPS information in the EXIF, this is what\nis called ",(0,i.kt)("inlineCode",{parentName:"p"},"originalLngLat")," ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/viewer.Image#originallnglat"},"Image.originalLngLat"),"."),(0,i.kt)("p",null,"When Structure from Motions has been run for a image a ",(0,i.kt)("inlineCode",{parentName:"p"},"computedLngLat")," that\ndiffers from the ",(0,i.kt)("inlineCode",{parentName:"p"},"originalLngLat")," will be created. It is different because\nGPS positions are not very exact and SfM aligns the camera positions according\nto the 3D reconstruction ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/viewer.Image#computedlnglat"},"Image.computedLngLat"),"."),(0,i.kt)("p",null,"At last there exist a ",(0,i.kt)("inlineCode",{parentName:"p"},"lngLat")," property which evaluates to\nthe ",(0,i.kt)("inlineCode",{parentName:"p"},"computedLngLat")," from SfM if it exists but falls back\nto the ",(0,i.kt)("inlineCode",{parentName:"p"},"originalLngLat")," from the EXIF GPS otherwise ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/viewer.Image#lnglat"},"Image.lngLat"),"."),(0,i.kt)("p",null,"Everything that is done in in the Viewer is based on the SfM positions,\ni.e. ",(0,i.kt)("inlineCode",{parentName:"p"},"computedLngLat"),". That is why the smooth transitions go in the right\ndirection (nd not in strange directions because of bad GPS)."),(0,i.kt)("p",null,"E.g. when placing a marker in the Viewer it is relative to the SfM\nposition i.e. the ",(0,i.kt)("inlineCode",{parentName:"p"},"computedLngLat"),"."),(0,i.kt)("p",null,"The same concept as above also applies to the compass angle (or bearing) properties\n",(0,i.kt)("inlineCode",{parentName:"p"},"originalCa"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"computedCa")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"ca"),"."),(0,i.kt)("h2",{id:"accessors"},"Accessors"),(0,i.kt)("h3",{id:"cameraparameters"},"cameraParameters"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"cameraParameters"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number"),"[]"),(0,i.kt)("p",null,"Get cameraParameters."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Will be undefined if SfM has\nnot been run."),(0,i.kt)("p",null,"Camera type dependent parameters."),(0,i.kt)("p",null,"For perspective and fisheye camera types,\nthe camera parameters array should be\nconstructed according to"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"[focal, k1, k2]")),(0,i.kt)("p",null,"where focal is the camera focal length,\nand k1, k2 are radial distortion parameters."),(0,i.kt)("p",null,"For spherical camera type the camera\nparameters are unset or emtpy array."),(0,i.kt)("h4",{id:"returns"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number"),"[]"),(0,i.kt)("p",null,"The parameters\nrelated to the camera type."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L110"},"graph/Image.ts:110")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"cameratype"},"cameraType"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"cameraType"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get cameraType."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Will be undefined if SfM has not been run."),(0,i.kt)("h4",{id:"returns-1"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"The camera type that captured the image."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L121"},"graph/Image.ts:121")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"capturedat"},"capturedAt"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"capturedAt"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get capturedAt."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Timestamp of the image capture date\nand time represented as a Unix epoch timestamp in milliseconds."),(0,i.kt)("h4",{id:"returns-2"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Timestamp when the image was captured."),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L133"},"graph/Image.ts:133")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"clusterid"},"clusterId"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"clusterId"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get clusterId."),(0,i.kt)("h4",{id:"returns-3"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Globally unique id of the SfM cluster to which\nthe image belongs."),(0,i.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L143"},"graph/Image.ts:143")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"compassangle"},"compassAngle"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"compassAngle"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get compassAngle."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," If the SfM computed compass angle exists it will\nbe returned, otherwise the original EXIF compass angle."),(0,i.kt)("h4",{id:"returns-4"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Compass angle, measured in degrees\nclockwise with respect to north."),(0,i.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L171"},"graph/Image.ts:171")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"computedaltitude"},"computedAltitude"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"computedAltitude"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get computedAltitude."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," If SfM has not been run the computed altitude is\nset to a default value of two meters."),(0,i.kt)("h4",{id:"returns-5"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Altitude, in meters."),(0,i.kt)("h4",{id:"defined-in-5"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L200"},"graph/Image.ts:200")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"computedcompassangle"},"computedCompassAngle"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"computedCompassAngle"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get computedCompassAngle."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Will not be set if SfM has not been run."),(0,i.kt)("h4",{id:"returns-6"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"SfM computed compass angle, measured\nin degrees clockwise with respect to north."),(0,i.kt)("h4",{id:"defined-in-6"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L212"},"graph/Image.ts:212")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"computedlnglat"},"computedLngLat"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"computedLngLat"),"(): ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"Get computedLngLat."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Will not be set if SfM has not been run."),(0,i.kt)("h4",{id:"returns-7"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"SfM computed longitude, latitude in WGS84 datum,\nmeasured in degrees."),(0,i.kt)("h4",{id:"defined-in-7"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L224"},"graph/Image.ts:224")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"creatorid"},"creatorId"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"creatorId"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get creatorId."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Note that the creator ID will not be set when using\nthe Mapillary API."),(0,i.kt)("h4",{id:"returns-8"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Globally unique id of the user who uploaded\nthe image."),(0,i.kt)("h4",{id:"defined-in-8"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L237"},"graph/Image.ts:237")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"creatorusername"},"creatorUsername"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"creatorUsername"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get creatorUsername."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Note that the creator username will not be set when\nusing the Mapillary API."),(0,i.kt)("h4",{id:"returns-9"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Username of the creator who uploaded\nthe image."),(0,i.kt)("h4",{id:"defined-in-9"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L250"},"graph/Image.ts:250")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"exiforientation"},"exifOrientation"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"exifOrientation"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get exifOrientation."),(0,i.kt)("h4",{id:"returns-10"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"EXIF orientation of original image."),(0,i.kt)("h4",{id:"defined-in-10"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L260"},"graph/Image.ts:260")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"height"},"height"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"height"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get height."),(0,i.kt)("h4",{id:"returns-11"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Height of original image, not adjusted\nfor orientation."),(0,i.kt)("h4",{id:"defined-in-11"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L270"},"graph/Image.ts:270")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"id"},"id"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"id"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get id."),(0,i.kt)("h4",{id:"returns-12"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Globally unique id of the image."),(0,i.kt)("h4",{id:"defined-in-12"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L302"},"graph/Image.ts:302")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"image"},"image"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"image"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"HTMLImageElement")),(0,i.kt)("p",null,"Get image."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," The image will always be set on the current image."),(0,i.kt)("h4",{id:"returns-13"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"HTMLImageElement")),(0,i.kt)("p",null,"Cached image element of the image."),(0,i.kt)("h4",{id:"defined-in-13"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L281"},"graph/Image.ts:281")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"lnglat"},"lngLat"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"lngLat"),"(): ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"Get lngLat."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," If the SfM computed longitude, latitude exist\nit will be returned, otherwise the original EXIF latitude\nlongitude."),(0,i.kt)("h4",{id:"returns-14"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"Longitude, latitude in WGS84 datum,\nmeasured in degrees."),(0,i.kt)("h4",{id:"defined-in-14"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L316"},"graph/Image.ts:316")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"mergeid"},"mergeId"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"mergeId"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get mergeId."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Will not be set if SfM has not yet been run on\nimage."),(0,i.kt)("h4",{id:"returns-15"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Id of connected component to which image\nbelongs after the aligning merge."),(0,i.kt)("h4",{id:"defined-in-15"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L343"},"graph/Image.ts:343")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"merged"},"merged"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"merged"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"boolean")),(0,i.kt)("p",null,"Get merged."),(0,i.kt)("h4",{id:"returns-16"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"boolean")),(0,i.kt)("p",null,"Value indicating whether SfM has been\nrun on the image and the image has been merged into a\nconnected component."),(0,i.kt)("h4",{id:"defined-in-16"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L329"},"graph/Image.ts:329")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"mesh"},"mesh"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"mesh"),"(): ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.MeshContract"},(0,i.kt)("inlineCode",{parentName:"a"},"MeshContract"))),(0,i.kt)("p",null,"Get mesh."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," The mesh will always be set on the current image."),(0,i.kt)("h4",{id:"returns-17"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.MeshContract"},(0,i.kt)("inlineCode",{parentName:"a"},"MeshContract"))),(0,i.kt)("p",null,"SfM triangulated mesh of reconstructed\natomic 3D points."),(0,i.kt)("h4",{id:"defined-in-17"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L355"},"graph/Image.ts:355")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"originalaltitude"},"originalAltitude"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"originalAltitude"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get originalAltitude."),(0,i.kt)("h4",{id:"returns-18"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"EXIF altitude, in meters, if available."),(0,i.kt)("h4",{id:"defined-in-18"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L364"},"graph/Image.ts:364")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"originalcompassangle"},"originalCompassAngle"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"originalCompassAngle"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get originalCompassAngle."),(0,i.kt)("h4",{id:"returns-19"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Original EXIF compass angle, measured in\ndegrees."),(0,i.kt)("h4",{id:"defined-in-19"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L374"},"graph/Image.ts:374")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"originallnglat"},"originalLngLat"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"originalLngLat"),"(): ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"Get originalLngLat."),(0,i.kt)("h4",{id:"returns-20"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"Original EXIF longitude, latitude in\nWGS84 datum, measured in degrees."),(0,i.kt)("h4",{id:"defined-in-20"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L384"},"graph/Image.ts:384")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"ownerid"},"ownerId"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"ownerId"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get ownerId."),(0,i.kt)("h4",{id:"returns-21"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Globally unique id of the owner to which\nthe image belongs. If the image does not belong to an\nowner the owner id will be undefined."),(0,i.kt)("h4",{id:"defined-in-21"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L395"},"graph/Image.ts:395")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"private"},"private"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"private"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"boolean")),(0,i.kt)("p",null,"Get private."),(0,i.kt)("h4",{id:"returns-22"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"boolean")),(0,i.kt)("p",null,"Value specifying if image is accessible to\norganization members only or to everyone."),(0,i.kt)("h4",{id:"defined-in-22"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L407"},"graph/Image.ts:407")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"qualityscore"},"qualityScore"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"qualityScore"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get qualityScore."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Value should be on the interval ","[0, 1]","."),(0,i.kt)("h4",{id:"returns-23"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"A number between zero and one\ndetermining the quality of the image. Blurriness\n(motion blur / out-of-focus), occlusion (camera\nmount, ego vehicle, water-drops), windshield\nreflections, bad illumination (exposure, glare),\nand bad weather condition (fog, rain, snow)\naffect the quality score."),(0,i.kt)("h4",{id:"defined-in-23"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L424"},"graph/Image.ts:424")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"rotation"},"rotation"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"rotation"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number"),"[]"),(0,i.kt)("p",null,"Get rotation."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Will not be set if SfM has not been run."),(0,i.kt)("h4",{id:"returns-24"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number"),"[]"),(0,i.kt)("p",null,"Rotation vector in angle axis representation."),(0,i.kt)("h4",{id:"defined-in-24"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L435"},"graph/Image.ts:435")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"scale"},"scale"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"scale"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get scale."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Will not be set if SfM has not been run."),(0,i.kt)("h4",{id:"returns-25"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Scale of reconstruction the image\nbelongs to."),(0,i.kt)("h4",{id:"defined-in-25"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L447"},"graph/Image.ts:447")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"sequenceid"},"sequenceId"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"sequenceId"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get sequenceId."),(0,i.kt)("h4",{id:"returns-26"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Globally unique id of the sequence\nto which the image belongs."),(0,i.kt)("h4",{id:"defined-in-26"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L457"},"graph/Image.ts:457")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"width"},"width"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"width"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Get width."),(0,i.kt)("h4",{id:"returns-27"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Width of original image, not\nadjusted for orientation."),(0,i.kt)("h4",{id:"defined-in-27"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/graph/Image.ts#L521"},"graph/Image.ts:521")))}d.isMDXComponent=!0}}]);