'use strict';

var mongoose = require('mongoose'),
    async = require('async'),
    Schema = mongoose.Schema,
    superPagination = require('../lib/mongoose');

var title = 'Hello';

describe('Book', function () {

    var Book, Type;

    before(function (done) {
        async.waterfall([

            function (next) {
                mongoose.connect(process.env.MONGO_DB || 'mongodb://localhost/test');
                next();
            },
            function (next) {
                var BookSchema = new Schema({
                    title: String,
                    type: {
                        type: Schema.Types.ObjectId,
                        ref: 'Type'
                    },
                    created: {
                        type: Date,
                        default: Date.now
                    }
                });

                BookSchema.plugin(superPagination);

                mongoose.model('Book', BookSchema);

                var TypeSchema = new Schema({
                    name: String
                });

                mongoose.model('Type', TypeSchema);

                Book = mongoose.model('Book');

                Type = mongoose.model('Type');

                next(null);
            },
            function (next) {
                var name = 'Awesome';
                Type.findOne({
                        name: name
                    },
                    function (err, type) {
                        if (err) throw err;
                        if (type && type.length) next(null, Book, Type, type);

                        var newType = new Type({
                            name: name
                        });
                        newType.save(function (err, type) {
                            if (err) return next(err);
                            next(null, type);
                        });
                    });

            },
            function (type, next) {

                Book.count({
                        title: title
                    },
                    function (err, count) {
                        if (err) throw err;
                        async.whilst(
                            function () {
                                return count < 20;
                            },
                            function (callback) {
                                count++;
                                var book = new Book({
                                    title: title,
                                    type: type
                                });
                                book.save(callback);
                            },
                            function (err) {
                                if (err) throw err;

                                next(null);
                            }
                        );
                    });
            }
        ], function (err) {
            if (err) throw err;

            done();
        });
    });

    describe('#find()', function () {
        it('should save without error', function (done) {
            Type.find({}, done);
        });
    });

    describe('#paginate()', function () {

        it('should return results and pagination', function (done) {
            Book.paginate({
                query: {
                    name: 'Hello'
                },
                page: 1,
                select: 'title',
                populate: 'type',
                sort: {
                    'created': -1
                },
                per_page: 5,
                url: '/'
            }, function (err, results, pagination) {
                if (err) throw err;
                var json = pagination.json();
                if (!json) {
                    throw Error('No pagination');
                }
                done();
            });
        });

        it('should return no results and pagination', function (done) {
            Book.paginate({
                query: {
                    name: 'Bacon'
                }
            }, function (err, results, pagination) {
                if (err) throw err;
                if (results.length) {
                    throw Error('Should return no results');
                }

                var json = pagination.json();
                if (!json) {
                    throw Error('No pagination');
                }

                done();
            });
        });

    });

});
