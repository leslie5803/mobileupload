;(function ($,doc) {
    'use strict';

    var defaultOps = {
        url: null,
        quality: 40,
        resize: false,
        scale:{
            maxWidth: 640,
            maxHeight: null
        },
        output: null,
        formData: {},
        uploadProgress: function () {

        },
        uploadComplete: function () {

        },
        uploadFailed: function () {

        },
        uploadCanceled: function () {

        },
        uploading: function () {

        }
    };

    function _compload(evt, options) {
        var self = this;

        this.defaults = $.extend(true, defaultOps, options);
        if(!this.defaults.url){
            throw new Error('url is invalid');
        }

        this.afterSelect = function () {
            var file = evt.target.files[0],
                reg  = new RegExp('^image.*$'),
                type = this.defaults.output || file.type;

            if(!file){
                throw new Error('文件为空');
            }
            if(!reg.test(file.type)){
                throw new Error('只能上传图片');
            }

            var reader = new FileReader(),
                i      = doc.createElement('img');

            reader.onload = function (e) {
                i.src = e.target.result;
            }
            reader.readAsDataURL(file);

            i.onload = function (e) {
                var compressImg = self.compress(i, self.defaults.quality, type),
                    imgFile     = self.convert(compressImg.src);

                self.upload(imgFile);
            };
        }

        this.compress = function (source_img_obj, quality, outputType) {

            var cvs     = doc.createElement('canvas'),
                nWidth  = source_img_obj.naturalWidth,
                nHeight = source_img_obj.naturalHeight,
                sWidth  = self.defaults.scale.maxWidth,
                sHeight = self.defaults.scale.maxHeight,
                scale   = 1;

		if(self.defaults.resize){
                    if(sWidth && sHeight){
                        scale = Math.min(sWidth/nWidth, sHeight/nHeight);
                    }else if (sWidth && nWidth >= sWidth && !sHeight){
                        scale = sWidth/nWidth;
                    }else if (!sWidth && nHeight >= sHeight && sHeight){
                        scale = sHeight/nHeight;
                    }
                }

            cvs.width  = nWidth * scale;
            cvs.height = nHeight * scale;

            var ctx              = cvs.getContext("2d").drawImage(source_img_obj, 0, 0, cvs.width, cvs.height),
                newImageData     = cvs.toDataURL(outputType, quality/100),
                result_image_obj = new Image();

            result_image_obj.src = newImageData;

            return result_image_obj;
        }

        this.convert = function (img_src) {
            var BASE64_MARKER = ';base64,',
                dataURL = img_src;
            if (dataURL.indexOf(BASE64_MARKER) == -1) {
                var parts = dataURL.split(',');
                var contentType = parts[0].split(':')[1];
                var raw = parts[1];

                return new Blob([raw], {type: contentType});
            }

            var parts = dataURL.split(BASE64_MARKER);
            var contentType = parts[0].split(':')[1];
            var raw = window.atob(parts[1]);
            var rawLength = raw.length;

            var uInt8Array = new Uint8Array(rawLength);

            for (var i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            return new Blob([uInt8Array], {type: contentType});
        }

        this.upload = function (file) {
            self.defaults.uploading();
            setTimeout(function () {
                var fd = new FormData();
                fd.append("file", file);
                for (var k in self.defaults.formData){
                    fd.append(k, self.defaults.formData[k]);
                }
                var xhr = new XMLHttpRequest();
                xhr.upload.addEventListener("progress", self.defaults.uploadProgress, false);
                xhr.addEventListener("load", self.defaults.uploadComplete, false);
                xhr.addEventListener("error", self.defaults.uploadFailed, false);
                xhr.addEventListener("abort", self.defaults.uploadCanceled, false);
                xhr.open("POST", self.defaults.url);
                xhr.send(fd);
            }, 10);
        }

        this.afterSelect();
    }

    window.Compload = _compload;
})(jQuery,document);
