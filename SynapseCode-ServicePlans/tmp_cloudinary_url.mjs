import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({ cloud_name: 'dy8yuocwj', api_key: 'xxx', api_secret: 'yyy' });
console.log(cloudinary.url('SynapseCode-invoices/factura_synapsecode_test', { resource_type: 'raw', secure: true, sign_url: true }));
console.log(cloudinary.url('SynapseCode-invoices/factura_synapsecode_test', { resource_type: 'raw', secure: true, sign_url: true, type: 'authenticated' }));
