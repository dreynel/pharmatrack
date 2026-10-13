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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('barcode')->nullable()->index();
            $table->string('name');
            $table->string('generic_name')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('category')->nullable();
            $table->string('uom')->default('Box');
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->integer('reorder_point')->default(10);
            $table->string('batch_no')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('daily_avg_sales', 8, 2)->default(0);
            $table->integer('forecast_demand_30d')->default(0);
            $table->string('status')->default('In Stock');
            $table->boolean('is_bulk')->default(false);
            $table->foreignId('parent_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('child_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->integer('conversion_rate')->default(100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
