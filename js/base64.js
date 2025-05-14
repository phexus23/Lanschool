/** 
 * Base54 encoding / decoding of ArrayBuffer
 */
var g_encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
 
/** faster "non-native" way
 * 
 */
function ArrayBufferToBase64Ex(arrayBuffer) 
{
  var base64    = ''
  
  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder
 
  var a, b, c, d
  var chunk
  
//  console.log( "Base64 encoding " + arrayBuffer.byteLength + " bytes of data" );
//  console.log( "new buffer " + byteLength + " bytes of data, " + byteRemainder + " remainder, " + mainLength + " main length" );
 
  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) 
  {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
 
    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1
 
    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += g_encodings[a] + g_encodings[b] + g_encodings[c] + g_encodings[d]
  }
 
  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) 
  {
    chunk = bytes[mainLength]
 
    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
 
    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1
 
    base64 += g_encodings[a] + g_encodings[b] + '=='
  } 
  else if (byteRemainder == 2) 
  {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
 
    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
 
    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
 
    base64 += g_encodings[a] + g_encodings[b] + g_encodings[c] + '='
  }
  
  //console.log( "Encoded data is " + base64.length + " bytes" );
  
  return base64
}




/** 
 *convert Base64 back to ArrayBuffer
 *
 * returns ArrayBuffer
 **/

function Base64ToArrayBufferEx( input )
{
	var bytes = (input.length/4) * 3;
	var uarray = null;
//	var arrayBuffer
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	var j = 0;
	
	//get last chars to see if are valid
	var lkey1 = g_encodings.indexOf(input.charAt(input.length-1));
	var lkey2 = g_encodings.indexOf(input.charAt(input.length-2));
	
//	console.log( "Decoding data: [" + input + "]" );
//	console.log( "Expected result, " + bytes + " bytes " );
//	console.log( "Trailing: [" + input.charAt(input.length-2) + "("+ lkey2+")," + input.charAt(input.length-1) + "("+ lkey1+")]" );

	if (lkey1 == 64) bytes--; //padding chars, so skip
	if (lkey2 == 64) bytes--; //padding chars, so skip

	arrayBuffer = new ArrayBuffer(bytes);
//	console.log( "Updated result, " + bytes + " bytes " );

	uarray = new Uint8Array(arrayBuffer, 0 );
	//uarray = new Uint8Array(bytes);

	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	for (i=0; i<bytes; i+=3) 
	{        
			//get the 3 octects in 4 ascii chars
			enc1 = g_encodings.indexOf(input.charAt(j++));
			enc2 = g_encodings.indexOf(input.charAt(j++));
			enc3 = g_encodings.indexOf(input.charAt(j++));
			enc4 = g_encodings.indexOf(input.charAt(j++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			uarray[i] = chr1;                        
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
	}
	
	var len = uarray.byteLength;
	var output = '';
	
	/* TEST **
	var view = new Uint8Array( arrayBuffer, 0 );
	for (var i = 0; i < len; i++) 
	{
        output += String.fromCharCode( view[ i ] );
		console.log( "R: " + uarray[ i ] );
    }
	console.log( "DECODED DATA: [" + output + "] " + output.length + " bytes");
	
	** END TEST */

//	console.log( "Returning decoded data: " + uarray.byteLength + " bytes" );
	return arrayBuffer;
}



/*
Copyright (c) 2011, Daniel Guerrero
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Uses the new array typed in javascript to binary base64 encode/decode
 * at the moment just decodes a binary base64 encoded
 * into either an ArrayBuffer (decodeArrayBuffer)
 * or into an Uint8Array (decode)
 * 
 * References:
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
 */
var Base64Binary = {
        _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        
        /* will return a  Uint8Array type */
        decodeArrayBuffer: function(input) {
                var bytes = (input.length/4) * 3;
                var ab = new ArrayBuffer(bytes);
                this.decode(input, ab);
                
                return ab;
        },
        
        decode: function(input, arrayBuffer) {
                //get last chars to see if are valid
                var lkey1 = this._keyStr.indexOf(input.charAt(input.length-1));                 
                var lkey2 = this._keyStr.indexOf(input.charAt(input.length-2));                 
        
                var bytes = (input.length/4) * 3;
                if (lkey1 == 64) bytes--; //padding chars, so skip
                if (lkey2 == 64) bytes--; //padding chars, so skip
                
                var uarray;
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;
                var j = 0;
                
                if (arrayBuffer)
                        uarray = new Uint8Array(arrayBuffer);
                else
                        uarray = new Uint8Array(bytes);
                
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                
                for (i=0; i<bytes; i+=3) {        
                        //get the 3 octects in 4 ascii chars
                        enc1 = this._keyStr.indexOf(input.charAt(j++));
                        enc2 = this._keyStr.indexOf(input.charAt(j++));
                        enc3 = this._keyStr.indexOf(input.charAt(j++));
                        enc4 = this._keyStr.indexOf(input.charAt(j++));
        
                        chr1 = (enc1 << 2) | (enc2 >> 4);
                        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                        chr3 = ((enc3 & 3) << 6) | enc4;
        
                        uarray[i] = chr1;                        
                        if (enc3 != 64) uarray[i+1] = chr2;
                        if (enc4 != 64) uarray[i+2] = chr3;
                }
        
                return uarray;        
        }
}


function testBase64Ex()
{
	var test1 = new Uint8ClampedArray( [ 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90 ] );
	
	console.log( "Testing base64 encoding" );

	var len = test1.byteLength;
	var output = '';
	
	for (var i = 0; i < len; i++) 
	{
        output += String.fromCharCode( test1[ i ] );
    }
	console.log( "BEGINING DATA: [" + output + "] " + output.length + " bytes");

	
	var compressed_data = ArrayBufferToBase64Ex(test1);
	console.log( "ArrayBuffer 1 (" + test1.byteLength + " bytes) encoded into a string of " + compressed_data.length + " bytes" );
	console.log( "DATA: [" + compressed_data + "]" );
	
	var decompressed_data = Base64ToArrayBufferEx( compressed_data );
	
	console.log( "Base64 data (" + compressed_data.length + " bytes) decoded to an array of " + decompressed_data.byteLength + " bytes" );
	console.log( "DATA: " + decompressed_data.toString() + " " + decompressed_data.byteLength + " bytes" );
	
	var view = new Uint8Array( decompressed_data, 0 );
	var binary;
	len = decompressed_data.byteLength;
	output = '';
    for (var i = 0; i < len; i++) 
	{
		output += String.fromCharCode( view[ i ] );
//		console.log( "D: " + view[ i ] );
    }
	console.log( "ENDING DATA: [" + output + "] " + output.length + " bytes");
	

	
}