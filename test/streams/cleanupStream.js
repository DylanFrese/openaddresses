var tape = require( 'tape' );
var event_stream = require( 'event-stream' );

var CleanupStream = require( '../../lib/streams/cleanupStream' );

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape( 'cleanupStream trims whitespace from all fields', function(test) {
  var input = {
    NUMBER: '5 ',
    STREET: ' abcd ',
    LAT: 5,
    LON: 6,
    POSTCODE: ' def '
  };

  var cleanupStream = CleanupStream.create();

  test_stream([input], cleanupStream, function(err, records) {
    test.equal(records.length, 1, 'stream length unchanged');

    var record = records[0];
    test.equal(record.NUMBER, '5', 'NUMBER field is trimmed');
    test.equal(record.STREET, 'abcd', 'STREET field is trimmed');
    test.equal(record.POSTCODE, 'def', 'POSTCODE field is trimmed');
    test.end();
  });
});

tape( 'cleanupStream expands tokens ending in "-str." to "-strasse" (mostly DEU)', function(test) {
  var inputs = [
    { STREET: 'Grolmanstr.' },
    { STREET: 'Ohrdrufer Str' },
    { STREET: 'str. Mircești' }, // in Moldova the 'str.' prefix means 'Strada'
    { STREET: 'Sankt Nic Kirkestr' },
    { STREET: 'Große Str' },
    { STREET: 'Lindenstr' }
  ];
  var cleanupStream = CleanupStream.create();

  test_stream(inputs, cleanupStream, function(err, records) {
    test.equal(records.length, 6, 'stream length unchanged');

    test.equal(records[0].STREET, 'Grolmanstrasse', 'expanded');
    test.equal(records[1].STREET, 'Ohrdrufer Str', 'unchanged');
    test.equal(records[2].STREET, 'str. Mircești', 'unchanged');
    test.equal(records[3].STREET, 'Sankt Nic Kirkestrasse', 'expanded');
    test.equal(records[4].STREET, 'Große Str', 'unchanged');
    test.equal(records[5].STREET, 'Lindenstrasse', 'expanded');
    test.end();
  });
});
