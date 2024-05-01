/// <reference types="tree-sitter-cli/dsl" />
// @ts-check



module.exports = grammar({
  name: "eidos",


  extras: $ => [
    /\s/,
    /\t/,
    / /,
    /\\\r?\n/,
    $.comment,
  ],

  conflicts: $ => [
    [$.selection_statement],
  ],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.statement,
      $.function_decl,
    ),

    statement: $ => field("statement",
      choice(
        $.compound_statement,
        $.expr_statement,
        $.selection_statement,
        $.for_statement,
        $.do_while_statement,
        $.while_statement,
        $.jump_statement,
      ),
    ),

    selection_statement: $ => seq(
      'if',
      '(',
      $.expr,
      ')',
      $.statement,
      choice(
        seq(
          'else',
          $.statement,
        ),
        seq(),
      ),
    ),

    for_statement: $ => seq(
      'for',
      '(',
      $.identifier,
      'in',
      $.expr,
      ')',
      $.statement,
    ),

    do_while_statement: $ => seq(
      'do',
      $.statement,
      'while',
      '(',
      $.expr,
      ')',
      ';',
    ),

    while_statement: $ => seq(
      'while',
      '(',
      $.expr,
      ')',
      $.statement,
    ),

    jump_statement: $ => choice(
      seq('next', ';'),
      seq('break', ';'),
      seq('return',
        choice(
          seq($.expr),
          seq(),
        ),
        ';',
      ),
    ),



    expr_statement: $ => choice(
      ";",
      seq(
        $.assignment_expr,
        ";",
      ),
    ),

    compound_statement: $ => seq(
      '{',
      repeat(
        choice(
          $.statement,
        ),
      ),
      '}',
    ),

    assignment_expr: $ => seq(
      $.conditional_expr,
      choice(
        seq(
          "=",
          $.conditional_expr,
        ),
        seq(),
      ),
    ),

    expr: $ => $.conditional_expr,

    conditional_expr: $ => seq(
      $.logical_or_expr,
      choice(
        seq("?", $.conditional_expr, "else", $.conditional_expr),
        seq(),
      ),
    ),

    logical_or_expr: $ => seq(
      $.logical_and_expr,
      choice(
        repeat(
          seq(
            "|",
            $.logical_and_expr,
          ),
        ),
        seq(),
      ),
    ),

    logical_and_expr: $ => seq(
      $.equality_expr,
      choice(
        repeat(
          seq(
            '&',
            $.equality_expr,
          ),
        ),
        seq(),
      ),
    ),


    equality_expr: $ => seq(
      $.relational_expr,
      choice(
        seq(
          choice(
            '!=',
            '==',
          ),
          $.relational_expr,
        ),
        seq(),
      ),
    ),

    relational_expr: $ => seq(
      $.add_expr,
      seq(
        choice(
          seq(
            choice(
              '<',
              '<=',
              '>',
              '>=',
            ),
            $.add_expr,
          ),
          seq(),
        ),
      ),
    ),

    add_expr: $ => seq(
      $.mult_expr,
      choice(
        repeat(
          choice(
            seq(
              '+',
              $.mult_expr,
            ),
            seq(
              '-',
              $.mult_expr,
            ),
          ),
        ),
        seq(),
      ),
    ),

    mult_expr: $ => seq(
      $.seq_expr,
      choice(
        repeat(
          choice(
            seq('*', $.seq_expr),
            seq('/', $.seq_expr),
            seq('%', $.seq_expr),
          ),
        ),
        seq(),
      ),
    ),

    seq_expr: $ => seq(
      $.unary_exp_expr,
      choice(
        seq(
          ":", $.unary_exp_expr,
        ),
        seq(),
      ),
    ),

    unary_exp_expr: $ => seq(
      choice(
        seq(
          choice('!', '+', '-'),
          $.unary_exp_expr,
        ),
        seq(
          $.postfix_expr,
          choice(
            seq('^', $.unary_exp_expr),
            seq(),
          ),
        ),
      ),
    ),

    postfix_expr: $ => seq(
      $.primary_expr,
      choice(
        seq('[',
          choice(
            $.expr,
            seq(),
          ),
          choice(
            repeat(
              seq(
                ',',
                choice(
                  $.expr,
                  seq(),
                ),
              ),
            ),
            seq(),
          ),
          ']',
        ),
        seq('(', ')'),
        seq('(', $.argument_expr_list, ')'),
        seq('.', $.identifier),
        seq(),
      ),
    ),

    primary_expr: $ => choice(
      $.identifier,
      $.constant,
      seq('(', $.expr, ')'),
    ),

    argument_expr_list: $ => seq(
      $.argument_expr,
      choice(
        repeat(
          seq(
            ',',
            $.argument_expr,
          ),
        ),
      ),
    ),

    argument_expr: $ => choice(
      $.conditional_expr,
      seq(
        $.identifier,
        '=',
        $.conditional_expr,
      ),
    ),

    constant: $ => choice(
      $.number_literal,
      $.string_literal,
    ),

    // Functions
    function_decl: $ => seq(
      'function',
      $.return_type_spec,
      $.identifier,
      $.param_list,
      $.compound_statement,
    ),

    return_type_spec: $ => seq(
      '(',
      $.type_spec,
      ')',
    ),

    type_spec: $ => choice(
      'void',
      'NULL',
      'logical',
      'integer',
      'float',
      'string',
      seq(
        'object',
        choice(
          $.object_class_spec,
          seq(),
        ),
      ),
      'numeric',
      '+',
      '*',
      repeat1(
        choice(
          'v',
          'N',
          'l',
          'i',
          'f',
          's',
          seq(
            'o',
            choice(
              $.object_class_spec,
              seq(),
            ),
          ),
        ),
      ),
    ),

    object_class_spec: $ => seq(
      '<',
      $.identifier,
      '>',
    ),

    param_list: $ => choice(
      seq(
        $.type_spec,
        $.identifier,
      ),
      seq(
        "[",
        $.type_spec,
        $.identifier,
        "=",
        $.default_value,
        "]",
      ),
    ),

    default_value: $ => choice(
      $.identifier,
      seq(
        choice(
          '-',
          seq(),
        ),
        $.number_literal,
      ),
      $.string_literal,
    ),

    identifier: _ => /[a-zA-Z_][A-Za-z_0-9]*/,

    number_literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.hexadecimal_literal,
      $.exponential_literal,
    ),

    integer_literal: $ => /[0-9]+/,

    float_literal: $ => /[0-9]+\.[0-9]+/,

    hexadecimal_literal: $ => /0x[0-9a-fA-F]+/,

    exponential_literal: $ => /[0-9\.]+[eE]?[+\-]?[0-9]+/,

    string_literal: $ => choice(
      $.single_quoted_string,
      $.double_quoted_string,
      $.multi_line_string
    ),

    single_quoted_string: $ => seq(
      "'", repeat(choice(/[^'\\]/, /\\./)), "'"
    ),

    double_quoted_string: $ => seq(
      '"', repeat(choice(/[^"\\]/, /\\./)), '"'
    ),

    multi_line_string: $ => seq(
      '"""', repeat(choice(/[^\\]/, /\\./)), '"""'
    ),


    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: _ => token(choice(
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),

  }
});
