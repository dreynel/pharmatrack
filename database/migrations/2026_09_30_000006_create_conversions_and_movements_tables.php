<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('conversions', function (Blueprint $table) {
            $table->id();
            $table->string('conv_code')->unique();
            $table->dateTime('date');
            $table->foreignId('source_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('source_product_name');
            $table->string('source_uom')->default('Box');
            $table->integer('source_qty')->default(1);
            $table->foreignId('target_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('target_product_name');
            $table->string('target_uom')->default('Piece');
            $table->integer('target_qty')->default(100);
            $table->integer('multiplier')->default(100);
            $table->string('batch_no')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('operator')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_code')->unique();
            $table->dateTime('timestamp');
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');
            $table->string('type');
            $table->integer('qty_change');
            $table->integer('previous_stock');
            $table->integer('new_stock');
            $table->string('reference_id')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('supplier_name')->nullable();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name')->nullable();
            $table->integer('suggested_qty')->default(0);
            $table->integer('order_qty')->default(0);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->decimal('total_cost', 12, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->date('expected_delivery')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('conversions');
    }
};
